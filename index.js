// Démarrage : ton appli d'origine (HTML et code inchangés), livrée en plugin.
// Ses données sont dans le dossier du plugin, que NeoBase sauvegarde (synchro cloud et sauvegardes) ; à la première ouverture elle reprend ce que tu avais dans NeoBase.
// Elle demande l'accès complet pour utiliser les outils d'interface de NeoBase. NeoBase ne l'ouvre que si elle est signée.
const HTML = "<div class=\"appWrap\">\n      <div class=\"agHead\"><span class=\"label\">Démarrage</span><span class=\"hint\" id=\"suInfo\"></span><div class=\"agNav\"><button class=\"btn px\" id=\"suRefresh\">ACTUALISER</button></div></div>\n      <div class=\"hint\">Les programmes qui se lancent tout seuls quand tu allumes le PC. En désactiver un ne le désinstalle pas : il ne démarre simplement plus tout seul, comme dans le Gestionnaire des tâches. Le changement compte au prochain démarrage.</div>\n      <div id=\"suList\"></div>\n    </div>";
export default async function (ctx) {
  const view = ctx.view;
  if (!ctx.host) { view.textContent = "Ce plugin doit être approuvé par NeoBase pour s'ouvrir."; return; }
  const host = ctx.host, { el, toast, sfx, ask, newTab, pixIcon, PIX, WX } = host;
  const folder = ctx.folder, legacy = ctx.legacy || {};
  view.innerHTML = HTML;
  const $ = id => id === "startupApp" ? view : (view.querySelector('#' + id) || document.getElementById(id));  // les identifiants de ta vue d'abord, puis ceux de la page (fenêtres, menus)
  const doc = async n => { try { return await folder.read(n); } catch { return null; } };
  const __icon = () => ctx.icon;  // l'icône de ce plugin
  const TOKEN = ctx.token;  // le jeton du serveur local de NeoBase
  // ---- ton code d'origine ----
/* ---------- Démarrage app: programs launched with Windows, switched on / off like in the Task Manager ---------- */
async function suOpen() {
  $('suList').replaceChildren(el('div', 'hint', 'Lecture…'));
  const list = await neo.startupList(), on = list.filter(i => i.enabled).length;
  $('suInfo').textContent = list.length + ' programme' + (list.length > 1 ? 's' : '') + ' · ' + on + ' activé' + (on > 1 ? 's' : '');
  $('suList').replaceChildren(...list.sort((a, b) => b.editable - a.editable || a.name.localeCompare(b.name, 'fr')).map(it => {
    const r = el('div', 'sysCard px suRow' + (it.enabled ? '' : ' off')), ic = el('img'), n = el('div', 'tn'), sw = el('label', 'suSwitch'), cb = el('input');
    ic.src = it.exe ? '/api/icon?t=' + TOKEN + '&p=' + encodeURIComponent(it.exe) : ''; ic.onerror = () => ic.style.visibility = 'hidden';
    n.append(it.name, el('small', '', it.label + ' · ' + it.command));
    cb.type = 'checkbox'; cb.checked = it.enabled; cb.disabled = !it.editable;
    cb.onchange = async () => {
      try { await neo.startupSet({source: it.source, name: it.name, file: it.file, enabled: cb.checked}); toast(it.name + (cb.checked ? ' se lancera' : ' ne se lancera plus') + ' au prochain démarrage de Windows'); }
      catch (e) { cb.checked = !cb.checked; toast('Impossible : ' + e.message.replace(/^.*Error: /, ''), true); }
      suOpen();
    };
    sw.append(cb, el('span', '', it.editable ? (it.enabled ? 'ACTIVÉ' : 'DÉSACTIVÉ') : 'ADMIN'));
    sw.title = it.editable ? '' : 'Ce programme est lancé pour tous les utilisateurs : seul un administrateur peut le changer (Gestionnaire des tâches → Démarrage).';
    r.append(ic, n, sw);
    return r;
  }));
}
$('suRefresh').onclick = suOpen;  // (non indenté : les textes sur plusieurs lignes restent exactement les tiens)
  // ---- fin ----
  ctx.onOpen(() => { suOpen(); });
}
