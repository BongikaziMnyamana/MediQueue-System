package com.cput.mediqueuesystem.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cput.mediqueuesystem.domain.Patient;
import com.cput.mediqueuesystem.domain.SymptomsAnalysis;
import com.cput.mediqueuesystem.factory.SymptomsAnalysisFactory;
import com.cput.mediqueuesystem.repository.PatientRepository;
import com.cput.mediqueuesystem.repository.SymptomsAnalysisRepository;

/*
 * SymptomAnalyzerService.java
 * A rule-based symptom analyser. It scores the patient's described
 * symptoms against a medical knowledge base and produces the most
 * likely conditions with a confidence score. The result is persisted
 * so the patient can review their history. This is an educational
 * tool and never replaces a qualified medical diagnosis.
 *
 * Author: Uya
 * Date: 03 August 2026
 */

@Service
public class SymptomAnalyzerService {

    // Each condition has a set of keywords; the more that match, the
    // higher its confidence score.
    private static final Map<String, List<String>> KNOWLEDGE_BASE = createKnowledgeBase();

    private final SymptomsAnalysisRepository symptomsAnalysisRepository;
    private final PatientRepository patientRepository;

    @Autowired
    public SymptomAnalyzerService(SymptomsAnalysisRepository symptomsAnalysisRepository,
                                  PatientRepository patientRepository) {
        this.symptomsAnalysisRepository = symptomsAnalysisRepository;
        this.patientRepository = patientRepository;
    }

    private static Map<String, List<String>> createKnowledgeBase() {
        Map<String, List<String>> kb = new LinkedHashMap<>();
        kb.put("Influenza (Flu)", Arrays.asList(
                "fever", "cough", "sore throat", "runny nose", "body ache", "body aches",
                "muscle pain", "fatigue", "chills", "headache", "tired", "weakness"));
        kb.put("Common Cold", Arrays.asList(
                "runny nose", "sneezing", "sore throat", "congestion", "blocked nose",
                "watery eyes", "mild cough", "mild fever"));
        kb.put("COVID-19", Arrays.asList(
                "loss of taste", "loss of smell", "dry cough", "shortness of breath",
                "difficulty breathing", "fever", "fatigue", "sore throat", "body ache"));
        kb.put("Migraine", Arrays.asList(
                "severe headache", "throbbing", "nausea", "sensitivity to light",
                "sensitivity to sound", "light sensitivity", "vomiting with headache",
                "one-sided headache", "aura"));
        kb.put("Pharyngitis (Sore Throat Infection)", Arrays.asList(
                "sore throat", "difficulty swallowing", "pain swallowing", "swollen glands",
                "swollen tonsils", "white patches on throat", "fever", "red throat"));
        kb.put("Gastroenteritis (Stomach Bug)", Arrays.asList(
                "nausea", "vomiting", "diarrhea", "diarrhoea", "stomach cramps",
                "abdominal pain", "stomach pain", "loss of appetite", "dehydration"));
        kb.put("Urinary Tract Infection", Arrays.asList(
                "burning urination", "painful urination", "frequent urination",
                "cloudy urine", "blood in urine", "pelvic pain", "urinary urgency",
                "strong smelling urine"));
        kb.put("Allergic Rhinitis (Hay Fever)", Arrays.asList(
                "sneezing", "itchy eyes", "runny nose", "watery eyes", "itchy nose",
                "congestion", "itchy throat", "red eyes"));
        kb.put("Sinusitis (Sinus Infection)", Arrays.asList(
                "sinus pressure", "facial pain", "congestion", "blocked nose",
                "thick nasal discharge", "headache", "pain around eyes", "post nasal drip"));
        kb.put("Bronchitis", Arrays.asList(
                "persistent cough", "coughing with mucus", "chest discomfort", "wheezing",
                "shortness of breath", "fatigue", "sore chest", "low grade fever"));
        return kb;
    }

    /*
     * Runs the analysis for a patient id and free-text symptoms. Persists
     * the result and returns the saved SymptomsAnalysis.
     */
    public SymptomsAnalysis analyze(String patientId, String inputText) {
        if (patientId == null || patientId.isBlank() || inputText == null || inputText.isBlank()) {
            return null;
        }
        Patient patient = patientRepository.findById(patientId).orElse(null);
        if (patient == null) {
            return null;
        }

        List<String> found = new ArrayList<>();
        List<String> mentioned = Arrays.stream(inputText.toLowerCase(Locale.ROOT)
                        .replaceAll("[^a-zA-Z ]", " ")
                        .split("\\s+"))
                .filter(w -> !w.isBlank())
                .toList();

        List<Map.Entry<String, Integer>> scores = new ArrayList<>();
        for (Map.Entry<String, List<String>> condition : KNOWLEDGE_BASE.entrySet()) {
            int matched = 0;
            List<String> matchedSymptoms = new ArrayList<>();
            for (String keyword : condition.getValue()) {
                if (inputText.toLowerCase(Locale.ROOT).contains(keyword)) {
                    matched++;
                    matchedSymptoms.add(keyword);
                } else if (containsTyped(mentioned, keyword)) {
                    matched++;
                    matchedSymptoms.add(keyword);
                }
            }
            if (matched > 0) {
                scores.add(Map.entry(condition.getKey(), matched));
                found.add(condition.getKey() + " - " + String.join(", ", matchedSymptoms));
            }
        }

        scores.sort(Map.Entry.<String, Integer>comparingByValue().reversed()
                .thenComparing(e -> e.getKey()));

        int totalSymptoms = Math.max(1, maxSymptoms(scores));
        double confidence = scores.isEmpty() ? 0.0
                : (scores.get(0).getValue() * 100.0) / KNOWLEDGE_BASE.get(scores.get(0).getKey()).size();

        String predicted = scores.isEmpty()
                ? "No conditions matched your description"
                : String.join("; ", scores.stream()
                        .limit(3)
                        .map(e -> String.format("%s (%d%%)", e.getKey(),
                                (e.getValue() * 100) / KNOWLEDGE_BASE.get(e.getKey()).size()))
                        .toList());

        String suggested = scores.isEmpty()
                ? "Try describing fever, cough, pain, breathing or stomach symptoms"
                : String.join(", ", scores.get(0).getValue() < totalSymptoms
                        ? KNOWLEDGE_BASE.get(scores.get(0).getKey())
                        : symptomsStillToWatch(scores.get(0).getKey(), found));

        SymptomsAnalysis analysis = SymptomsAnalysisFactory.createSymptomsAnalysis(
                "SA-" + System.currentTimeMillis(), patient, inputText, predicted,
                suggested, Math.round(confidence * 100.0) / 100.0, LocalDateTime.now());
        if (analysis == null) {
            return null;
        }
        return symptomsAnalysisRepository.save(analysis);
    }

    private boolean containsTyped(List<String> words, String keyword) {
        return keyword.contains(" ") && String.join(" ", words).contains(keyword);
    }

    private int maxSymptoms(List<Map.Entry<String, Integer>> scores) {
        return scores.isEmpty() ? 0 : scores.stream().mapToInt(Map.Entry::getValue).max().orElse(0);
    }

    private List<String> symptomsStillToWatch(String condition, List<String> found) {
        List<String> all = new ArrayList<>(KNOWLEDGE_BASE.get(condition));
        for (String f : found) {
            if (f.startsWith(condition + " - ")) {
                String matched = f.substring(condition.length() + 3);
                all.removeAll(Arrays.asList(matched.split(", ")));
            }
        }
        return all;
    }

    public List<SymptomsAnalysis> getByPatient(String patientId) {
        return symptomsAnalysisRepository.findByPatientUserIdOrderByCreatedAtDesc(patientId);
    }
}