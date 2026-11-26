/*
 * OCBC test widget for Webex Contact Center Agent Desktop.
 * Proves a custom tab works: shows the agent, the selected call's caller number,
 * interaction ID and call-associated data. No buttons, no outgoing requests.
 *
 * Layout inputs (see the desktop layout JSON):
 *   properties.task      <- $STORE.agentContact.taskSelected
 *   properties.agentName <- $STORE.agent.agentName
 *   properties.darkMode  <- $STORE.app.darkMode
 */
(function () {
  var TAG = "ocbc-test-widget";
  if (customElements.get(TAG)) return;

  function esc(v) {
    return String(v === undefined || v === null || v === "" ? "-" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function pick(obj, paths) {
    for (var i = 0; i < paths.length; i++) {
      var cur = obj, parts = paths[i].split(".");
      for (var j = 0; j < parts.length && cur !== undefined && cur !== null; j++) cur = cur[parts[j]];
      if (cur !== undefined && cur !== null && cur !== "") return cur;
    }
    return undefined;
  }

  function safeJson(value) {
    var seen = [];
    try {
      return JSON.stringify(value, function (k, v) {
        if (typeof v === "object" && v !== null) {
          if (seen.indexOf(v) !== -1) return "[circular]";
          seen.push(v);
        }
        if (/token|secret|password/i.test(k)) return "[hidden]";
        return v;
      }, 2);
    } catch (e) {
      return "Could not read task data: " + e.message;
    }
  }

  class OcbcTestWidget extends HTMLElement {
    static get observedAttributes() { return ["agent-name"]; }

    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._task = null;
      this._dark = false;
      this._loadedAt = new Date();
      this._updates = 0;
    }

    set task(value) { this._task = value; this._updates++; this.render(); }
    get task() { return this._task; }

    set agentName(value) { this._agentName = value; this.render(); }
    get agentName() { return this._agentName; }

    set darkMode(value) { this._dark = value === true || value === "true"; this.render(); }
    get darkMode() { return this._dark; }

    connectedCallback() { this.render(); }
    attributeChangedCallback() { this.render(); }

    render() {
      var t = this._task || null;
      var interaction = t && (t.interaction || t);
      var ani = pick(interaction, ["callAssociatedDetails.ani", "contactDirection.ani", "ani"]) || pick(t, ["ani"]);
      var dnis = pick(interaction, ["callAssociatedDetails.dn", "dnis", "dn"]) || pick(t, ["dnis"]);
      var id = pick(t, ["interactionId", "interaction.interactionId", "id"]);
      var media = pick(interaction, ["mediaType", "mediaChannel"]) || pick(t, ["mediaType"]);
      var queue = pick(interaction, ["callAssociatedDetails.virtualTeamName", "queueName"]);
      var cad = pick(interaction, ["callAssociatedData"]) || {};
      var cadRows = Object.keys(cad).map(function (k) {
        var v = cad[k] && typeof cad[k] === "object" && "value" in cad[k] ? cad[k].value : cad[k];
        return "<tr><td>" + esc(k) + "</td><td>" + esc(typeof v === "object" ? safeJson(v) : v) + "</td></tr>";
      }).join("");

      var bg = this._dark ? "#1f1f1f" : "#ffffff";
      var fg = this._dark ? "#f2f2f2" : "#1f1f1f";
      var muted = this._dark ? "#a6a6a6" : "#666666";
      var line = this._dark ? "#3a3a3a" : "#e2e2e2";

      this.shadowRoot.innerHTML =
        "<style>" +
        ":host{display:block;height:100%;overflow:auto;font:14px/1.45 system-ui,-apple-system,Segoe UI,sans-serif;background:" + bg + ";color:" + fg + "}" +
        ".wrap{padding:16px}" +
        "h2{font-size:16px;margin:0 0 4px}" +
        ".ok{display:inline-block;font-size:12px;padding:2px 8px;border-radius:10px;background:#1b7f3b;color:#fff}" +
        ".muted{color:" + muted + ";font-size:12px}" +
        "table{border-collapse:collapse;width:100%;margin-top:12px}" +
        "td{border-top:1px solid " + line + ";padding:6px 4px;vertical-align:top}" +
        "td:first-child{color:" + muted + ";width:40%}" +
        "details{margin-top:12px}pre{white-space:pre-wrap;word-break:break-all;font-size:11px;max-height:240px;overflow:auto}" +
        "</style>" +
        "<div class='wrap'>" +
        "<h2>OCBC test widget <span class='ok'>Loaded</span></h2>" +
        "<div class='muted'>Loaded at " + esc(this._loadedAt.toLocaleTimeString()) +
        " | task updates received: " + this._updates + "</div>" +
        "<table>" +
        "<tr><td>Agent</td><td>" + esc(this._agentName || this.getAttribute("agent-name")) + "</td></tr>" +
        (t
          ? "<tr><td>Caller number (ANI)</td><td>" + esc(ani) + "</td></tr>" +
            "<tr><td>Dialled number</td><td>" + esc(dnis) + "</td></tr>" +
            "<tr><td>Interaction ID</td><td>" + esc(id) + "</td></tr>" +
            "<tr><td>Channel</td><td>" + esc(media) + "</td></tr>" +
            "<tr><td>Queue</td><td>" + esc(queue) + "</td></tr>"
          : "<tr><td>Call</td><td>No call selected</td></tr>") +
        "</table>" +
        (cadRows ? "<table><tr><td colspan='2'><b>Call-associated data</b></td></tr>" + cadRows + "</table>" : "") +
        (t ? "<details><summary>Raw task data</summary><pre>" + esc(safeJson(t)) + "</pre></details>" : "") +
        "</div>";
    }
  }

  customElements.define(TAG, OcbcTestWidget);
})();