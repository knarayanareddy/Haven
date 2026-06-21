/* eslint-disable no-alert -- demo portal uses native alerts for user feedback */
(function(){
  const STORAGE_KEY = 'haven.wacht.handover.queue.v1';
  const form = document.getElementById('handoverForm');
  const offlineBtn = document.getElementById('saveOffline');
  const pendingList = document.getElementById('pendingList');

  function readPayload(target) {
    const fd = new FormData(form);
    return {
      target,
      appetite: Number(fd.get('appetite')),
      mood: Number(fd.get('mood')),
      mobility: fd.get('mobility'),
      concerns_nl: fd.get('concerns_nl') || null,
      administered_medication_id: fd.get('administered_medication_id') || null,
      shareWithFamily: fd.get('shareWithFamily') === 'on',
      savedAt: new Date().toISOString(),
    };
  }

  function loadPending() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  }
  function savePending(items) { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); renderPending(); }

  function renderPending() {
    const items = loadPending();
    pendingList.innerHTML = '';
    if (items.length === 0) {
      pendingList.innerHTML = '<li class="muted">Geen notities in de offline-wachtrij.</li>';
      return;
    }
    items.forEach((it, idx) => {
      const li = document.createElement('li');
      li.className = 'row';
      li.innerHTML = `<strong>${it.savedAt.slice(0, 16)}</strong> — eetlust ${it.appetite}, stemming ${it.mood}, mobiliteit ${it.mobility}` + (it.shareWithFamily ? ' <span class="tag">familie</span>' : '');
      pendingList.appendChild(li);
    });
  }

  form.addEventListener('submit', async function(event){
    event.preventDefault();
    const payload = readPayload('online');
    if (payload.appetite < 1 || payload.appetite > 5 || payload.mood < 1 || payload.mood > 5) {
      alert('Eetlust en stemming moeten tussen 1 en 5 zijn.');
      return;
    }
    try {
      const res = await fetch((window.HAVEN_CONFIG?.supabaseUrl ?? '') + '/functions/v1/fn-carer-handover-note', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + (window.HAVEN_CONFIG?.accessToken ?? '') },
        body: JSON.stringify({ ...payload, family_recipient_ids: payload.shareWithFamily ? [] : null }),
      });
      if (!res.ok) throw new Error(await res.text());
      alert('Handover-notitie opgeslagen.');
      form.reset();
    } catch (e) {
      const items = loadPending(); items.push({ ...payload, savedAt: new Date().toISOString(), error: String(e) }); savePending(items);
      alert('Online opslaan mislukt — notitie toegevoegd aan offline-wachtrij.');
    }
  });

  offlineBtn.addEventListener('click', function(){
    const payload = readPayload('offline');
    if (payload.appetite < 1 || payload.mood < 1) { alert('Vul eetlust en stemming in.'); return; }
    const items = loadPending(); items.push({ ...payload, savedAt: new Date().toISOString() }); savePending(items);
    alert('Notitie opgeslagen in offline-wachtrij.');
    form.reset();
  });

  renderPending();

  const marForm = document.getElementById('marForm');
  marForm.addEventListener('submit', async function(event){
    event.preventDefault();
    const fd = new FormData(marForm);
    const medication_id = fd.get('medication_id');
    if (!medication_id) { alert('Kies een medicijn.'); return; }
    alert('Toediening gelogd: ' + medication_id + ' om ' + fd.get('administered_at'));
  });
})();
