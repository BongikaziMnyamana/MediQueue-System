// js/pages/queue.js
// Editing here means moving a patient through the real queue statuses,
// not a generic form — that's closer to how a receptionist would
// actually manage a live queue.

function renderQueue() {
  const data = getData();
  const queue = (data.queue || []).filter(isTodayQueueEntry);
  const body = document.getElementById("queueBody");
  document.getElementById("queueBodyCount").textContent = `${queue.length} records`;
  if (!queue.length) {
    body.innerHTML = `<tr><td colspan="6">The queue is empty.</td></tr>`;
    return;
  }
  body.innerHTML = queue.map((q) => `
    <tr>
      <td>${esc(queueNoLabel(q))}</td><td>${esc(q.patient)}</td><td>${esc(q.dept)}</td>
      <td>
        <select class="input" style="padding:5px 8px;font-size:12.5px;width:auto;" onchange="updateQueueStatus('${esc(q.entryId || "")}', this.value)">
          <option value="Pending" ${q.status === "Pending" ? "selected" : ""}>Pending (not approved)</option>
          <option value="Waiting" ${q.status === "Waiting" ? "selected" : ""}>Waiting</option>
          <option value="Ready for Doctor" ${q.status === "Ready for Doctor" ? "selected" : ""}>Ready for Doctor</option>
          <option value="In Consultation" ${q.status === "In Consultation" ? "selected" : ""}>In Consultation</option>
          <option value="Completed" ${q.status === "Completed" ? "selected" : ""}>Completed</option>
        </select>
      </td>
      <td>${q.wait}</td>
      <td class="action-cell">
        <button class="btn btn-danger btn-sm" onclick="removeFromQueue('${esc(q.entryId || "")}')">Remove</button>
      </td>
    </tr>
  `).join("");
}

async function updateQueueStatus(entryId, newStatus) {
  const entry = getData().queue.find((q) => q.entryId === entryId);
  if (!entry) return;
  if (!entry.entryId) {
    alert("This queue row is not stored on the server. Reload the page to sync from the database.");
    renderQueue();
    return;
  }

  if (
    newStatus === "In Consultation" &&
    entry.status !== "Ready for Doctor" &&
    entry.status !== "In Consultation"
  ) {
    alert("This patient must be assessed by a nurse before the consultation can start.");
    renderQueue();
    return;
  }

  // Only one person can be "In Consultation" at a time, so the others are
  // moved back to Waiting in the database first.
  if (newStatus === "In Consultation") {
    for (const q of getData().queue.filter(isTodayQueueEntry)) {
      if (q.entryId && q.entryId !== entry.entryId && q.status === "In Consultation") {
        const moved = await setQueueEntryStatusAsync(q.entryId, "Waiting");
        if (!moved.ok) {
          alert(moved.error || "Could not move the current patient back to Waiting.");
          renderQueue();
          return;
        }
      }
    }
  }

  const r = await setQueueEntryStatusAsync(entry.entryId, newStatus);
  if (!r.ok) {
    alert(r.error || "Could not update the queue status on the server.");
  }
  renderQueue();
}

async function removeFromQueue(entryId) {
  const q = getData().queue.find((entry) => entry.entryId === entryId);
  if (!q) return;
  if (!confirm(`Remove ${q.patient} (${queueNoLabel(q)}) from the queue? This can't be undone.`)) return;

  if (!q.entryId) {
    alert("This queue row is not stored on the server. Reload the page to sync from the database.");
    renderQueue();
    return;
  }
  const r = await deleteQueueEntryAsync(q.entryId);
  if (!r.ok) {
    alert(r.error || "Could not remove the patient from the server queue.");
    return;
  }
  renderQueue();
}

document.addEventListener("DOMContentLoaded", renderQueue);
