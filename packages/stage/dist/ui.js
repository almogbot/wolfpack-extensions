// vendor/wasm4/wasm4.js
function ensureRuntime() {
  if (customElements.get("wasm4-app"))
    return;
  var wasm4 = function(t) {
    var e;
    const s = globalThis, i = s.ShadowRoot && (s.ShadyCSS === undefined || s.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, n = Symbol(), r = new WeakMap;
    let o = class {
      constructor(t, e, s) {
        if (this._$cssResult$ = true, s !== n)
          throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
        this.cssText = t, this.t = e;
      }
      get styleSheet() {
        let t = this.o;
        const e = this.t;
        if (i && t === undefined) {
          const s = e !== undefined && e.length === 1;
          s && (t = r.get(e)), t === undefined && ((this.o = t = new CSSStyleSheet).replaceSync(this.cssText), s && r.set(e, t));
        }
        return t;
      }
      toString() {
        return this.cssText;
      }
    };
    const a = (t, ...e) => {
      const s = t.length === 1 ? t[0] : e.reduce((e, s, i) => e + ((t) => {
        if (t._$cssResult$ === true)
          return t.cssText;
        if (typeof t == "number")
          return t;
        throw Error("Value passed to 'css' function must be a 'css' function result: " + t + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
      })(s) + t[i + 1], t[0]);
      return new o(s, t, n);
    }, l = i ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((t) => {
      let e = "";
      for (const s of t.cssRules)
        e += s.cssText;
      return ((t) => new o(typeof t == "string" ? t : t + "", undefined, n))(e);
    })(t) : t, { is: h, defineProperty: c, getOwnPropertyDescriptor: d, getOwnPropertyNames: u, getOwnPropertySymbols: p, getPrototypeOf: f } = Object, m = globalThis, y = m.trustedTypes, w = y ? y.emptyScript : "", g = m.reactiveElementPolyfillSupport, b = (t, e) => t, v = { toAttribute(t, e) {
      switch (e) {
        case Boolean:
          t = t ? w : null;
          break;
        case Object:
        case Array:
          t = t == null ? t : JSON.stringify(t);
      }
      return t;
    }, fromAttribute(t, e) {
      let s = t;
      switch (e) {
        case Boolean:
          s = t !== null;
          break;
        case Number:
          s = t === null ? null : Number(t);
          break;
        case Object:
        case Array:
          try {
            s = JSON.parse(t);
          } catch (i) {
            s = null;
          }
      }
      return s;
    } }, A = (t, e) => !h(t, e), x = { attribute: true, type: String, converter: v, reflect: false, hasChanged: A };
    Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), m.litPropertyMetadata ?? (m.litPropertyMetadata = new WeakMap);

    class k extends HTMLElement {
      static addInitializer(t) {
        this._$Ei(), (this.l ?? (this.l = [])).push(t);
      }
      static get observedAttributes() {
        return this.finalize(), this._$Eh && [...this._$Eh.keys()];
      }
      static createProperty(t, e = x) {
        if (e.state && (e.attribute = false), this._$Ei(), this.elementProperties.set(t, e), !e.noAccessor) {
          const s = Symbol(), i = this.getPropertyDescriptor(t, s, e);
          i !== undefined && c(this.prototype, t, i);
        }
      }
      static getPropertyDescriptor(t, e, s) {
        const { get: i, set: n } = d(this.prototype, t) ?? { get() {
          return this[e];
        }, set(t) {
          this[e] = t;
        } };
        return { get() {
          return i == null ? undefined : i.call(this);
        }, set(e) {
          const r = i == null ? undefined : i.call(this);
          n.call(this, e), this.requestUpdate(t, r, s);
        }, configurable: true, enumerable: true };
      }
      static getPropertyOptions(t) {
        return this.elementProperties.get(t) ?? x;
      }
      static _$Ei() {
        if (this.hasOwnProperty(b("elementProperties")))
          return;
        const t = f(this);
        t.finalize(), t.l !== undefined && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
      }
      static finalize() {
        if (this.hasOwnProperty(b("finalized")))
          return;
        if (this.finalized = true, this._$Ei(), this.hasOwnProperty(b("properties"))) {
          const t = this.properties, e = [...u(t), ...p(t)];
          for (const s of e)
            this.createProperty(s, t[s]);
        }
        const t = this[Symbol.metadata];
        if (t !== null) {
          const e = litPropertyMetadata.get(t);
          if (e !== undefined)
            for (const [t, s] of e)
              this.elementProperties.set(t, s);
        }
        this._$Eh = new Map;
        for (const [e, s] of this.elementProperties) {
          const t = this._$Eu(e, s);
          t !== undefined && this._$Eh.set(t, e);
        }
        this.elementStyles = this.finalizeStyles(this.styles);
      }
      static finalizeStyles(t) {
        const e = [];
        if (Array.isArray(t)) {
          const s = new Set(t.flat(1 / 0).reverse());
          for (const t of s)
            e.unshift(l(t));
        } else
          t !== undefined && e.push(l(t));
        return e;
      }
      static _$Eu(t, e) {
        const s = e.attribute;
        return s === false ? undefined : typeof s == "string" ? s : typeof t == "string" ? t.toLowerCase() : undefined;
      }
      constructor() {
        super(), this._$Ep = undefined, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
      }
      _$Ev() {
        var t;
        this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = new Map, this._$E_(), this.requestUpdate(), (t = this.constructor.l) == null || t.forEach((t) => t(this));
      }
      addController(t) {
        var e;
        (this._$EO ?? (this._$EO = new Set)).add(t), this.renderRoot !== undefined && this.isConnected && ((e = t.hostConnected) == null || e.call(t));
      }
      removeController(t) {
        var e;
        (e = this._$EO) == null || e.delete(t);
      }
      _$E_() {
        const t = new Map, e = this.constructor.elementProperties;
        for (const s of e.keys())
          this.hasOwnProperty(s) && (t.set(s, this[s]), delete this[s]);
        t.size > 0 && (this._$Ep = t);
      }
      createRenderRoot() {
        const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
        return ((t, e) => {
          if (i)
            t.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
          else
            for (const i of e) {
              const e = document.createElement("style"), n = s.litNonce;
              n !== undefined && e.setAttribute("nonce", n), e.textContent = i.cssText, t.appendChild(e);
            }
        })(t, this.constructor.elementStyles), t;
      }
      connectedCallback() {
        var t;
        this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(true), (t = this._$EO) == null || t.forEach((t) => {
          var e;
          return (e = t.hostConnected) == null ? undefined : e.call(t);
        });
      }
      enableUpdating(t) {}
      disconnectedCallback() {
        var t;
        (t = this._$EO) == null || t.forEach((t) => {
          var e;
          return (e = t.hostDisconnected) == null ? undefined : e.call(t);
        });
      }
      attributeChangedCallback(t, e, s) {
        this._$AK(t, s);
      }
      _$EC(t, e) {
        var s;
        const i = this.constructor.elementProperties.get(t), n = this.constructor._$Eu(t, i);
        if (n !== undefined && i.reflect === true) {
          const r = (((s = i.converter) == null ? undefined : s.toAttribute) !== undefined ? i.converter : v).toAttribute(e, i.type);
          this._$Em = t, r == null ? this.removeAttribute(n) : this.setAttribute(n, r), this._$Em = null;
        }
      }
      _$AK(t, e) {
        var s;
        const i = this.constructor, n = i._$Eh.get(t);
        if (n !== undefined && this._$Em !== n) {
          const t = i.getPropertyOptions(n), r = typeof t.converter == "function" ? { fromAttribute: t.converter } : ((s = t.converter) == null ? undefined : s.fromAttribute) !== undefined ? t.converter : v;
          this._$Em = n, this[n] = r.fromAttribute(e, t.type), this._$Em = null;
        }
      }
      requestUpdate(t, e, s) {
        if (t !== undefined) {
          if (s ?? (s = this.constructor.getPropertyOptions(t)), !(s.hasChanged ?? A)(this[t], e))
            return;
          this.P(t, e, s);
        }
        this.isUpdatePending === false && (this._$ES = this._$ET());
      }
      P(t, e, s) {
        this._$AL.has(t) || this._$AL.set(t, e), s.reflect === true && this._$Em !== t && (this._$Ej ?? (this._$Ej = new Set)).add(t);
      }
      async _$ET() {
        this.isUpdatePending = true;
        try {
          await this._$ES;
        } catch (e) {
          Promise.reject(e);
        }
        const t = this.scheduleUpdate();
        return t != null && await t, !this.isUpdatePending;
      }
      scheduleUpdate() {
        return this.performUpdate();
      }
      performUpdate() {
        var t;
        if (!this.isUpdatePending)
          return;
        if (!this.hasUpdated) {
          if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
            for (const [t, e] of this._$Ep)
              this[t] = e;
            this._$Ep = undefined;
          }
          const t = this.constructor.elementProperties;
          if (t.size > 0)
            for (const [e, s] of t)
              s.wrapped !== true || this._$AL.has(e) || this[e] === undefined || this.P(e, this[e], s);
        }
        let e = false;
        const s = this._$AL;
        try {
          e = this.shouldUpdate(s), e ? (this.willUpdate(s), (t = this._$EO) == null || t.forEach((t) => {
            var e;
            return (e = t.hostUpdate) == null ? undefined : e.call(t);
          }), this.update(s)) : this._$EU();
        } catch (i) {
          throw e = false, this._$EU(), i;
        }
        e && this._$AE(s);
      }
      willUpdate(t) {}
      _$AE(t) {
        var e;
        (e = this._$EO) == null || e.forEach((t) => {
          var e;
          return (e = t.hostUpdated) == null ? undefined : e.call(t);
        }), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t)), this.updated(t);
      }
      _$EU() {
        this._$AL = new Map, this.isUpdatePending = false;
      }
      get updateComplete() {
        return this.getUpdateComplete();
      }
      getUpdateComplete() {
        return this._$ES;
      }
      shouldUpdate(t) {
        return true;
      }
      update(t) {
        this._$Ej && (this._$Ej = this._$Ej.forEach((t) => this._$EC(t, this[t]))), this._$EU();
      }
      updated(t) {}
      firstUpdated(t) {}
    }
    k.elementStyles = [], k.shadowRootOptions = { mode: "open" }, k[b("elementProperties")] = new Map, k[b("finalized")] = new Map, g == null || g({ ReactiveElement: k }), (m.reactiveElementVersions ?? (m.reactiveElementVersions = [])).push("2.0.4");
    const S = globalThis, E = S.trustedTypes, $ = E ? E.createPolicy("lit-html", { createHTML: (t) => t }) : undefined, _ = "$lit$", P = `lit$${(Math.random() + "").slice(9)}$`, C = "?" + P, U = `<${C}>`, I = document, T = () => I.createComment(""), M = (t) => t === null || typeof t != "object" && typeof t != "function", L = Array.isArray, O = `[ 	
\f\r]`, R = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, N = /-->/g, B = />/g, D = RegExp(`>|${O}(?:([^\\s"'>=/]+)(${O}*=${O}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), F = /'/g, H = /"/g, z = /^(?:script|style|textarea|title)$/i, j = (q = 1, (t, ...e) => ({ _$litType$: q, strings: t, values: e })), V = Symbol.for("lit-noChange"), W = Symbol.for("lit-nothing"), G = new WeakMap, K = I.createTreeWalker(I, 129);
    var q;
    function Y(t, e) {
      if (!Array.isArray(t) || !t.hasOwnProperty("raw"))
        throw Error("invalid template strings array");
      return $ !== undefined ? $.createHTML(e) : e;
    }

    class J {
      constructor({ strings: t, _$litType$: e }, s) {
        let i;
        this.parts = [];
        let n = 0, r = 0;
        const o = t.length - 1, a = this.parts, [l, h] = ((t, e) => {
          const s = t.length - 1, i = [];
          let n, r = e === 2 ? "<svg>" : "", o = R;
          for (let a = 0;a < s; a++) {
            const e = t[a];
            let s, l, h = -1, c = 0;
            for (;c < e.length && (o.lastIndex = c, l = o.exec(e), l !== null); )
              c = o.lastIndex, o === R ? l[1] === "!--" ? o = N : l[1] !== undefined ? o = B : l[2] !== undefined ? (z.test(l[2]) && (n = RegExp("</" + l[2], "g")), o = D) : l[3] !== undefined && (o = D) : o === D ? l[0] === ">" ? (o = n ?? R, h = -1) : l[1] === undefined ? h = -2 : (h = o.lastIndex - l[2].length, s = l[1], o = l[3] === undefined ? D : l[3] === '"' ? H : F) : o === H || o === F ? o = D : o === N || o === B ? o = R : (o = D, n = undefined);
            const d = o === D && t[a + 1].startsWith("/>") ? " " : "";
            r += o === R ? e + U : h >= 0 ? (i.push(s), e.slice(0, h) + _ + e.slice(h) + P + d) : e + P + (h === -2 ? a : d);
          }
          return [Y(t, r + (t[s] || "<?>") + (e === 2 ? "</svg>" : "")), i];
        })(t, e);
        if (this.el = J.createElement(l, s), K.currentNode = this.el.content, e === 2) {
          const t = this.el.content.firstChild;
          t.replaceWith(...t.childNodes);
        }
        for (;(i = K.nextNode()) !== null && a.length < o; ) {
          if (i.nodeType === 1) {
            if (i.hasAttributes())
              for (const t of i.getAttributeNames())
                if (t.endsWith(_)) {
                  const e = h[r++], s = i.getAttribute(t).split(P), o = /([.?@])?(.*)/.exec(e);
                  a.push({ type: 1, index: n, name: o[2], strings: s, ctor: o[1] === "." ? et : o[1] === "?" ? st : o[1] === "@" ? it : tt }), i.removeAttribute(t);
                } else
                  t.startsWith(P) && (a.push({ type: 6, index: n }), i.removeAttribute(t));
            if (z.test(i.tagName)) {
              const t = i.textContent.split(P), e = t.length - 1;
              if (e > 0) {
                i.textContent = E ? E.emptyScript : "";
                for (let s = 0;s < e; s++)
                  i.append(t[s], T()), K.nextNode(), a.push({ type: 2, index: ++n });
                i.append(t[e], T());
              }
            }
          } else if (i.nodeType === 8)
            if (i.data === C)
              a.push({ type: 2, index: n });
            else {
              let t = -1;
              for (;(t = i.data.indexOf(P, t + 1)) !== -1; )
                a.push({ type: 7, index: n }), t += P.length - 1;
            }
          n++;
        }
      }
      static createElement(t, e) {
        const s = I.createElement("template");
        return s.innerHTML = t, s;
      }
    }
    function X(t, e, s = t, i) {
      var n, r;
      if (e === V)
        return e;
      let o = i !== undefined ? (n = s._$Co) == null ? undefined : n[i] : s._$Cl;
      const a = M(e) ? undefined : e._$litDirective$;
      return (o == null ? undefined : o.constructor) !== a && ((r = o == null ? undefined : o._$AO) == null || r.call(o, false), a === undefined ? o = undefined : (o = new a(t), o._$AT(t, s, i)), i !== undefined ? (s._$Co ?? (s._$Co = []))[i] = o : s._$Cl = o), o !== undefined && (e = X(t, o._$AS(t, e.values), o, i)), e;
    }

    class Z {
      constructor(t, e) {
        this._$AV = [], this._$AN = undefined, this._$AD = t, this._$AM = e;
      }
      get parentNode() {
        return this._$AM.parentNode;
      }
      get _$AU() {
        return this._$AM._$AU;
      }
      u(t) {
        const { el: { content: e }, parts: s } = this._$AD, i = ((t == null ? undefined : t.creationScope) ?? I).importNode(e, true);
        K.currentNode = i;
        let n = K.nextNode(), r = 0, o = 0, a = s[0];
        for (;a !== undefined; ) {
          if (r === a.index) {
            let e;
            a.type === 2 ? e = new Q(n, n.nextSibling, this, t) : a.type === 1 ? e = new a.ctor(n, a.name, a.strings, this, t) : a.type === 6 && (e = new nt(n, this, t)), this._$AV.push(e), a = s[++o];
          }
          r !== (a == null ? undefined : a.index) && (n = K.nextNode(), r++);
        }
        return K.currentNode = I, i;
      }
      p(t) {
        let e = 0;
        for (const s of this._$AV)
          s !== undefined && (s.strings !== undefined ? (s._$AI(t, s, e), e += s.strings.length - 2) : s._$AI(t[e])), e++;
      }
    }

    class Q {
      get _$AU() {
        var t;
        return ((t = this._$AM) == null ? undefined : t._$AU) ?? this._$Cv;
      }
      constructor(t, e, s, i) {
        this.type = 2, this._$AH = W, this._$AN = undefined, this._$AA = t, this._$AB = e, this._$AM = s, this.options = i, this._$Cv = (i == null ? undefined : i.isConnected) ?? true;
      }
      get parentNode() {
        let t = this._$AA.parentNode;
        const e = this._$AM;
        return e !== undefined && (t == null ? undefined : t.nodeType) === 11 && (t = e.parentNode), t;
      }
      get startNode() {
        return this._$AA;
      }
      get endNode() {
        return this._$AB;
      }
      _$AI(t, e = this) {
        t = X(this, t, e), M(t) ? t === W || t == null || t === "" ? (this._$AH !== W && this._$AR(), this._$AH = W) : t !== this._$AH && t !== V && this._(t) : t._$litType$ !== undefined ? this.$(t) : t.nodeType !== undefined ? this.T(t) : ((t) => L(t) || typeof (t == null ? undefined : t[Symbol.iterator]) == "function")(t) ? this.k(t) : this._(t);
      }
      S(t) {
        return this._$AA.parentNode.insertBefore(t, this._$AB);
      }
      T(t) {
        this._$AH !== t && (this._$AR(), this._$AH = this.S(t));
      }
      _(t) {
        this._$AH !== W && M(this._$AH) ? this._$AA.nextSibling.data = t : this.T(I.createTextNode(t)), this._$AH = t;
      }
      $(t) {
        var e;
        const { values: s, _$litType$: i } = t, n = typeof i == "number" ? this._$AC(t) : (i.el === undefined && (i.el = J.createElement(Y(i.h, i.h[0]), this.options)), i);
        if (((e = this._$AH) == null ? undefined : e._$AD) === n)
          this._$AH.p(s);
        else {
          const t = new Z(n, this), e = t.u(this.options);
          t.p(s), this.T(e), this._$AH = t;
        }
      }
      _$AC(t) {
        let e = G.get(t.strings);
        return e === undefined && G.set(t.strings, e = new J(t)), e;
      }
      k(t) {
        L(this._$AH) || (this._$AH = [], this._$AR());
        const e = this._$AH;
        let s, i = 0;
        for (const n of t)
          i === e.length ? e.push(s = new Q(this.S(T()), this.S(T()), this, this.options)) : s = e[i], s._$AI(n), i++;
        i < e.length && (this._$AR(s && s._$AB.nextSibling, i), e.length = i);
      }
      _$AR(t = this._$AA.nextSibling, e) {
        var s;
        for ((s = this._$AP) == null || s.call(this, false, true, e);t && t !== this._$AB; ) {
          const e = t.nextSibling;
          t.remove(), t = e;
        }
      }
      setConnected(t) {
        var e;
        this._$AM === undefined && (this._$Cv = t, (e = this._$AP) == null || e.call(this, t));
      }
    }

    class tt {
      get tagName() {
        return this.element.tagName;
      }
      get _$AU() {
        return this._$AM._$AU;
      }
      constructor(t, e, s, i, n) {
        this.type = 1, this._$AH = W, this._$AN = undefined, this.element = t, this.name = e, this._$AM = i, this.options = n, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String), this.strings = s) : this._$AH = W;
      }
      _$AI(t, e = this, s, i) {
        const n = this.strings;
        let r = false;
        if (n === undefined)
          t = X(this, t, e, 0), r = !M(t) || t !== this._$AH && t !== V, r && (this._$AH = t);
        else {
          const i = t;
          let o, a;
          for (t = n[0], o = 0;o < n.length - 1; o++)
            a = X(this, i[s + o], e, o), a === V && (a = this._$AH[o]), r || (r = !M(a) || a !== this._$AH[o]), a === W ? t = W : t !== W && (t += (a ?? "") + n[o + 1]), this._$AH[o] = a;
        }
        r && !i && this.j(t);
      }
      j(t) {
        t === W ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
      }
    }

    class et extends tt {
      constructor() {
        super(...arguments), this.type = 3;
      }
      j(t) {
        this.element[this.name] = t === W ? undefined : t;
      }
    }

    class st extends tt {
      constructor() {
        super(...arguments), this.type = 4;
      }
      j(t) {
        this.element.toggleAttribute(this.name, !!t && t !== W);
      }
    }

    class it extends tt {
      constructor(t, e, s, i, n) {
        super(t, e, s, i, n), this.type = 5;
      }
      _$AI(t, e = this) {
        if ((t = X(this, t, e, 0) ?? W) === V)
          return;
        const s = this._$AH, i = t === W && s !== W || t.capture !== s.capture || t.once !== s.once || t.passive !== s.passive, n = t !== W && (s === W || i);
        i && this.element.removeEventListener(this.name, this, s), n && this.element.addEventListener(this.name, this, t), this._$AH = t;
      }
      handleEvent(t) {
        var e;
        typeof this._$AH == "function" ? this._$AH.call(((e = this.options) == null ? undefined : e.host) ?? this.element, t) : this._$AH.handleEvent(t);
      }
    }

    class nt {
      constructor(t, e, s) {
        this.element = t, this.type = 6, this._$AN = undefined, this._$AM = e, this.options = s;
      }
      get _$AU() {
        return this._$AM._$AU;
      }
      _$AI(t) {
        X(this, t);
      }
    }
    const rt = S.litHtmlPolyfillSupport;
    rt == null || rt(J, Q), (S.litHtmlVersions ?? (S.litHtmlVersions = [])).push("3.1.2");

    class ot extends k {
      constructor() {
        super(...arguments), this.renderOptions = { host: this }, this._$Do = undefined;
      }
      createRenderRoot() {
        var t;
        const e = super.createRenderRoot();
        return (t = this.renderOptions).renderBefore ?? (t.renderBefore = e.firstChild), e;
      }
      update(t) {
        const e = this.render();
        this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = ((t, e, s) => {
          const i = (s == null ? undefined : s.renderBefore) ?? e;
          let n = i._$litPart$;
          if (n === undefined) {
            const t = (s == null ? undefined : s.renderBefore) ?? null;
            i._$litPart$ = n = new Q(e.insertBefore(T(), t), t, undefined, s ?? {});
          }
          return n._$AI(t), n;
        })(e, this.renderRoot, this.renderOptions);
      }
      connectedCallback() {
        var t;
        super.connectedCallback(), (t = this._$Do) == null || t.setConnected(true);
      }
      disconnectedCallback() {
        var t;
        super.disconnectedCallback(), (t = this._$Do) == null || t.setConnected(false);
      }
      render() {
        return V;
      }
    }
    ot._$litElement$ = true, ot.finalized = true, (e = globalThis.litElementHydrateSupport) == null || e.call(globalThis, { LitElement: ot });
    const at = globalThis.litElementPolyfillSupport;
    at == null || at({ LitElement: ot }), (globalThis.litElementVersions ?? (globalThis.litElementVersions = [])).push("4.0.4");
    const lt = (t) => (e, s) => {
      s !== undefined ? s.addInitializer(() => {
        customElements.get(t) || customElements.define(t, e);
      }) : customElements.get(t) || customElements.define(t, e);
    }, ht = { attribute: true, type: String, converter: v, reflect: false, hasChanged: A }, ct = (t = ht, e, s) => {
      const { kind: i, metadata: n } = s;
      let r = globalThis.litPropertyMetadata.get(n);
      if (r === undefined && globalThis.litPropertyMetadata.set(n, r = new Map), r.set(s.name, t), i === "accessor") {
        const { name: i } = s;
        return { set(s) {
          const n = e.get.call(this);
          e.set.call(this, s), this.requestUpdate(i, n, t);
        }, init(e) {
          return e !== undefined && this.P(i, undefined, t), e;
        } };
      }
      if (i === "setter") {
        const { name: i } = s;
        return function(s) {
          const n = this[i];
          e.call(this, s), this.requestUpdate(i, n, t);
        };
      }
      throw Error("Unsupported decorator location: " + i);
    };
    function dt(t) {
      return function(t) {
        return (e, s) => typeof s == "object" ? ct(t, e, s) : ((t, e, s) => {
          const i = e.hasOwnProperty(s);
          return e.constructor.createProperty(s, i ? { ...t, wrapped: true } : t), i ? Object.getOwnPropertyDescriptor(e, s) : undefined;
        })(t, e, s);
      }({ ...t, state: true, attribute: false });
    }
    const ut = (t, e, s) => (s.configurable = true, s.enumerable = true, Reflect.decorate && typeof e != "object" && Object.defineProperty(t, e, s), s);
    function pt(t, e) {
      return (s, i, n) => {
        const r = (e) => {
          var s;
          return ((s = e.renderRoot) == null ? undefined : s.querySelector(t)) ?? null;
        };
        if (e) {
          const { get: t, set: e } = typeof i == "object" ? s : n ?? (() => {
            const t = Symbol();
            return { get() {
              return this[t];
            }, set(e) {
              this[t] = e;
            } };
          })();
          return ut(s, i, { get() {
            let s = t.call(this);
            return s === undefined && (s = r(this), (s !== null || this.hasUpdated) && e.call(this, s)), s;
          } });
        }
        return ut(s, i, { get() {
          return r(this);
        } });
      };
    }
    const ft = 160, mt = 160, yt = 1024, wt = [14743759, 8831084, 3172432, 464929], gt = 16, bt = 32, vt = 64, At = 128, xt = Uint8Array.of(255, 255, 255, 255, 255, 255, 255, 255, 199, 199, 199, 207, 207, 255, 207, 255, 147, 147, 147, 255, 255, 255, 255, 255, 147, 1, 147, 147, 147, 1, 147, 255, 239, 131, 47, 131, 233, 3, 239, 255, 157, 91, 55, 239, 217, 181, 115, 255, 143, 39, 39, 143, 37, 51, 129, 255, 207, 207, 207, 255, 255, 255, 255, 255, 243, 231, 207, 207, 207, 231, 243, 255, 159, 207, 231, 231, 231, 207, 159, 255, 255, 147, 199, 1, 199, 147, 255, 255, 255, 231, 231, 129, 231, 231, 255, 255, 255, 255, 255, 255, 255, 207, 207, 159, 255, 255, 255, 129, 255, 255, 255, 255, 255, 255, 255, 255, 255, 207, 207, 255, 253, 251, 247, 239, 223, 191, 127, 255, 199, 179, 57, 57, 57, 155, 199, 255, 231, 199, 231, 231, 231, 231, 129, 255, 131, 57, 241, 195, 135, 31, 1, 255, 129, 243, 231, 195, 249, 57, 131, 255, 227, 195, 147, 51, 1, 243, 243, 255, 3, 63, 3, 249, 249, 57, 131, 255, 195, 159, 63, 3, 57, 57, 131, 255, 1, 57, 243, 231, 207, 207, 207, 255, 135, 59, 27, 135, 97, 121, 131, 255, 131, 57, 57, 129, 249, 243, 135, 255, 255, 207, 207, 255, 207, 207, 255, 255, 255, 207, 207, 255, 207, 207, 159, 255, 243, 231, 207, 159, 207, 231, 243, 255, 255, 255, 1, 255, 1, 255, 255, 255, 159, 207, 231, 243, 231, 207, 159, 255, 131, 1, 57, 243, 199, 255, 199, 255, 131, 125, 69, 85, 65, 127, 131, 255, 199, 147, 57, 57, 1, 57, 57, 255, 3, 57, 57, 3, 57, 57, 3, 255, 195, 153, 63, 63, 63, 153, 195, 255, 7, 51, 57, 57, 57, 51, 7, 255, 1, 63, 63, 3, 63, 63, 1, 255, 1, 63, 63, 3, 63, 63, 63, 255, 193, 159, 63, 49, 57, 153, 193, 255, 57, 57, 57, 1, 57, 57, 57, 255, 129, 231, 231, 231, 231, 231, 129, 255, 249, 249, 249, 249, 249, 57, 131, 255, 57, 51, 39, 15, 7, 35, 49, 255, 159, 159, 159, 159, 159, 159, 129, 255, 57, 17, 1, 1, 41, 57, 57, 255, 57, 25, 9, 1, 33, 49, 57, 255, 131, 57, 57, 57, 57, 57, 131, 255, 3, 57, 57, 57, 3, 63, 63, 255, 131, 57, 57, 57, 33, 51, 133, 255, 3, 57, 57, 49, 7, 35, 49, 255, 135, 51, 63, 131, 249, 57, 131, 255, 129, 231, 231, 231, 231, 231, 231, 255, 57, 57, 57, 57, 57, 57, 131, 255, 57, 57, 57, 17, 131, 199, 239, 255, 57, 57, 41, 1, 1, 17, 57, 255, 57, 17, 131, 199, 131, 17, 57, 255, 153, 153, 153, 195, 231, 231, 231, 255, 1, 241, 227, 199, 143, 31, 1, 255, 195, 207, 207, 207, 207, 207, 195, 255, 127, 191, 223, 239, 247, 251, 253, 255, 135, 231, 231, 231, 231, 231, 135, 255, 199, 147, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 1, 239, 247, 255, 255, 255, 255, 255, 255, 255, 255, 131, 249, 129, 57, 129, 255, 63, 63, 3, 57, 57, 57, 131, 255, 255, 255, 129, 63, 63, 63, 129, 255, 249, 249, 129, 57, 57, 57, 129, 255, 255, 255, 131, 57, 1, 63, 131, 255, 241, 231, 129, 231, 231, 231, 231, 255, 255, 255, 129, 57, 57, 129, 249, 131, 63, 63, 3, 57, 57, 57, 57, 255, 231, 255, 199, 231, 231, 231, 129, 255, 243, 255, 227, 243, 243, 243, 243, 135, 63, 63, 49, 3, 7, 35, 49, 255, 199, 231, 231, 231, 231, 231, 129, 255, 255, 255, 3, 73, 73, 73, 73, 255, 255, 255, 3, 57, 57, 57, 57, 255, 255, 255, 131, 57, 57, 57, 131, 255, 255, 255, 3, 57, 57, 3, 63, 63, 255, 255, 129, 57, 57, 129, 249, 249, 255, 255, 145, 143, 159, 159, 159, 255, 255, 255, 131, 63, 131, 249, 3, 255, 231, 231, 129, 231, 231, 231, 231, 255, 255, 255, 57, 57, 57, 57, 129, 255, 255, 255, 153, 153, 153, 195, 231, 255, 255, 255, 73, 73, 73, 73, 129, 255, 255, 255, 57, 1, 199, 1, 57, 255, 255, 255, 57, 57, 57, 129, 249, 131, 255, 255, 1, 227, 199, 143, 1, 255, 243, 231, 231, 207, 231, 231, 243, 255, 231, 231, 231, 231, 231, 231, 231, 255, 159, 207, 207, 231, 207, 207, 159, 255, 255, 255, 143, 69, 227, 255, 255, 255, 255, 255, 255, 255, 255, 147, 147, 255, 131, 41, 41, 17, 41, 41, 131, 255, 131, 57, 9, 17, 33, 57, 131, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 131, 17, 33, 125, 33, 17, 131, 255, 131, 17, 9, 125, 9, 17, 131, 255, 131, 17, 57, 85, 17, 17, 131, 255, 131, 17, 17, 85, 57, 17, 131, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 231, 255, 231, 231, 199, 199, 199, 255, 239, 131, 41, 47, 41, 131, 239, 255, 195, 153, 159, 3, 159, 159, 1, 255, 255, 165, 219, 219, 219, 165, 255, 255, 153, 153, 195, 129, 231, 129, 231, 255, 231, 231, 231, 255, 231, 231, 231, 255, 195, 153, 135, 219, 225, 153, 195, 255, 147, 255, 255, 255, 255, 255, 255, 255, 195, 189, 102, 94, 94, 102, 189, 195, 135, 195, 147, 195, 255, 255, 255, 255, 255, 201, 147, 39, 147, 201, 255, 255, 255, 255, 129, 249, 249, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 195, 189, 70, 90, 70, 90, 189, 195, 131, 255, 255, 255, 255, 255, 255, 255, 239, 215, 239, 255, 255, 255, 255, 255, 231, 231, 129, 231, 231, 255, 129, 255, 199, 243, 231, 195, 255, 255, 255, 255, 195, 231, 243, 199, 255, 255, 255, 255, 247, 239, 255, 255, 255, 255, 255, 255, 255, 255, 51, 51, 51, 51, 9, 63, 193, 149, 181, 149, 193, 245, 245, 255, 255, 255, 255, 207, 207, 255, 255, 255, 255, 255, 255, 255, 255, 255, 247, 207, 231, 199, 231, 195, 255, 255, 255, 255, 199, 147, 147, 199, 255, 255, 255, 255, 255, 39, 147, 201, 147, 39, 255, 255, 189, 59, 183, 173, 217, 177, 125, 255, 189, 59, 183, 169, 221, 187, 113, 255, 29, 187, 215, 45, 217, 177, 125, 255, 199, 255, 199, 159, 57, 1, 131, 255, 223, 239, 199, 147, 57, 1, 57, 255, 247, 239, 199, 147, 57, 1, 57, 255, 199, 147, 199, 147, 57, 1, 57, 255, 203, 167, 199, 147, 57, 1, 57, 255, 147, 255, 199, 147, 57, 1, 57, 255, 239, 215, 199, 147, 57, 1, 57, 255, 193, 135, 39, 33, 7, 39, 33, 255, 195, 153, 63, 63, 153, 195, 247, 207, 223, 239, 1, 63, 3, 63, 1, 255, 247, 239, 1, 63, 3, 63, 1, 255, 199, 147, 1, 63, 3, 63, 1, 255, 147, 255, 1, 63, 3, 63, 1, 255, 239, 247, 129, 231, 231, 231, 129, 255, 247, 239, 129, 231, 231, 231, 129, 255, 231, 195, 129, 231, 231, 231, 129, 255, 153, 255, 129, 231, 231, 231, 129, 255, 135, 147, 153, 9, 153, 147, 135, 255, 203, 167, 25, 9, 1, 33, 49, 255, 223, 239, 131, 57, 57, 57, 131, 255, 247, 239, 131, 57, 57, 57, 131, 255, 199, 147, 131, 57, 57, 57, 131, 255, 203, 167, 131, 57, 57, 57, 131, 255, 147, 255, 131, 57, 57, 57, 131, 255, 255, 187, 215, 239, 215, 187, 255, 255, 131, 57, 49, 41, 25, 57, 131, 255, 223, 239, 57, 57, 57, 57, 131, 255, 247, 239, 57, 57, 57, 57, 131, 255, 199, 147, 255, 57, 57, 57, 131, 255, 147, 255, 57, 57, 57, 57, 131, 255, 247, 239, 153, 153, 195, 231, 231, 255, 63, 3, 57, 57, 57, 3, 63, 255, 195, 153, 153, 147, 153, 137, 147, 255, 223, 239, 131, 249, 129, 57, 129, 255, 247, 239, 131, 249, 129, 57, 129, 255, 199, 147, 131, 249, 129, 57, 129, 255, 203, 167, 131, 249, 129, 57, 129, 255, 147, 255, 131, 249, 129, 57, 129, 255, 239, 215, 131, 249, 129, 57, 129, 255, 255, 255, 131, 233, 129, 47, 131, 255, 255, 255, 129, 63, 63, 129, 247, 207, 223, 239, 131, 57, 1, 63, 131, 255, 247, 239, 131, 57, 1, 63, 131, 255, 199, 147, 131, 57, 1, 63, 131, 255, 147, 255, 131, 57, 1, 63, 131, 255, 223, 239, 255, 199, 231, 231, 129, 255, 247, 239, 255, 199, 231, 231, 129, 255, 199, 147, 255, 199, 231, 231, 129, 255, 147, 255, 199, 231, 231, 231, 129, 255, 155, 135, 103, 131, 57, 57, 131, 255, 203, 167, 3, 57, 57, 57, 57, 255, 223, 239, 131, 57, 57, 57, 131, 255, 247, 239, 131, 57, 57, 57, 131, 255, 199, 147, 131, 57, 57, 57, 131, 255, 203, 167, 131, 57, 57, 57, 131, 255, 147, 255, 131, 57, 57, 57, 131, 255, 255, 231, 255, 129, 255, 231, 255, 255, 255, 255, 131, 49, 41, 25, 131, 255, 223, 239, 57, 57, 57, 57, 129, 255, 247, 239, 57, 57, 57, 57, 129, 255, 199, 147, 255, 57, 57, 57, 129, 255, 147, 255, 57, 57, 57, 57, 129, 255, 247, 239, 57, 57, 57, 129, 249, 131, 63, 63, 3, 57, 57, 3, 63, 63, 147, 255, 57, 57, 57, 129, 249, 131);
    function kt(t) {
      const e = new URL(location.href), s = e.searchParams.get(t);
      if (s != null)
        return s;
      return new URL(e.hash.substring(1), "https://x").searchParams.get(t);
    }
    function St() {
      if (document.fullscreenElement == null) {
        let t = function() {
          const t = window.frameElement;
          t && (t.style.position = "fixed", t.style.top = "0", t.style.left = "0", t.style.zIndex = "99999", t.style.width = "100%", t.style.height = "100%");
        };
        const e = document.body.requestFullscreen && document.body.requestFullscreen({ navigationUI: "hide" });
        e ? e.catch(t) : t();
      }
    }
    const Et = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#".split(""), $t = [0, 68, 0, 84, 83, 82, 72, 0, 75, 76, 70, 65, 0, 63, 62, 69, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 64, 0, 73, 66, 74, 71, 81, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 77, 0, 78, 67, 0, 0, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 79, 0, 80, 0, 0];
    function _t(t) {
      const e = t.length, s = e % 4, i = s ? e + 4 - s : e;
      let n = "", r = 0, o = 0;
      for (;r < i; ) {
        const s = r < e ? t[r] : 0;
        if (++r, o = 256 * o + s, r % 4 == 0) {
          let t = 52200625;
          for (;t >= 1; ) {
            const e = Math.floor(o / t) % 85;
            n += Et[e], t /= 85;
          }
          o = 0;
        }
      }
      return n;
    }
    function Pt(t, e) {
      let s = 0, i = 0, n = 0;
      const r = t.length, o = e.length;
      if (t.length % 5 == 0)
        for (;i < r; ) {
          const r = t.charCodeAt(i++) - 32;
          if (r < 0 || r >= $t.length)
            return s;
          if (n = 85 * n + $t[r], i % 5 == 0) {
            let t = 16777216;
            for (;t >= 1; ) {
              if (s >= o)
                return s;
              e[s++] = n / t % 256, t /= 256;
            }
            n = 0;
          }
        }
      return s;
    }

    class Ct {
      constructor() {
        this.memory = new ArrayBuffer(65536), this.globals = {}, this.diskBuffer = new ArrayBuffer(yt), this.diskSize = 0;
      }
      read(t) {
        new Uint8Array(this.memory).set(new Uint8Array(t.memory.buffer)), this.globals = {};
        for (const e in t.wasm.exports) {
          const s = t.wasm.exports[e];
          s instanceof WebAssembly.Global && (this.globals[e] = s.value.toString());
        }
        this.diskSize = t.diskSize, new Uint8Array(this.diskBuffer).set(new Uint8Array(t.diskBuffer, 0, t.diskSize));
      }
      write(t) {
        new Uint8Array(t.memory.buffer).set(new Uint8Array(this.memory));
        for (const e in t.wasm.exports) {
          const s = t.wasm.exports[e];
          if (s instanceof WebAssembly.Global && e in this.globals)
            try {
              s.value = this.globals[e];
            } catch {}
        }
        t.diskSize = this.diskSize, new Uint8Array(t.diskBuffer).set(new Uint8Array(this.diskBuffer, 0, this.diskSize));
      }
      toBytes() {
        const t = new TextEncoder().encode(JSON.stringify(this.globals)), e = new Uint8Array(65544 + t.byteLength + this.diskSize), s = new DataView(e.buffer, e.byteOffset, e.byteLength);
        e.set(new Uint8Array(this.memory), 0);
        let i = 65536;
        return s.setUint32(i, t.byteLength), e.set(t, i + 4), i += 4 + t.byteLength, s.setUint32(i, this.diskSize), e.set(new Uint8Array(this.diskBuffer, 0, this.diskSize), i + 4), e;
      }
      fromBytes(t) {
        const e = new DataView(t.buffer, t.byteOffset, t.byteLength);
        new Uint8Array(this.memory).set(t.subarray(0, 65536));
        let s = 65536;
        const i = e.getUint32(s), n = t.slice(s + 4, s + 4 + i);
        this.globals = JSON.parse(new TextDecoder().decode(n)), s += 4 + i, this.diskSize = e.getUint32(s), new Uint8Array(this.diskBuffer).set(t.subarray(s + 4, s + 4 + this.diskSize));
      }
    }
    const Ut = 20;

    class It {
      constructor() {
        this.frame = -1, this.state = new Ct, this.inputs = new Array(4), this.predicted = new Array(4);
        for (let t = 0;t < 4; ++t)
          this.inputs[t] = 0, this.predicted[t] = true;
      }
    }

    class Tt {
      constructor() {
        this.futureInputs = new Map;
      }
    }

    class Mt {
      constructor(t, e) {
        this.currentFrame = t, this.runtime = e, this.rollbackIdx = Ut, this.history = new Array(Ut);
        for (let s = 0;s < Ut; ++s)
          this.history[s] = new It;
        this.players = new Array(4);
        for (let s = 0;s < 4; ++s)
          this.players[s] = new Tt;
      }
      addInputs(t, e, s) {
        const i = this.players[t];
        for (const n of s) {
          if (e >= this.currentFrame)
            i.futureInputs.has(e) || i.futureInputs.set(e, n);
          else
            for (let s = 0, i = Ut;s < i; ++s) {
              const i = this.history[s];
              if (i.frame == e) {
                i.predicted[t] && (i.predicted[t] = false, i.inputs[t] != n && (i.inputs[t] = n, this.rollbackIdx = Math.min(s, this.rollbackIdx)));
                break;
              }
            }
          ++e;
        }
      }
      update() {
        if (this.rollbackIdx < Ut) {
          for (let e = this.rollbackIdx + 1;e < Ut; ++e) {
            const t = this.history[e];
            for (let s = 0;s < 4; ++s)
              if (t.predicted[s]) {
                const i = this.history[e - 1];
                t.inputs[s] = i.inputs[s];
              }
          }
          let t = true;
          for (;this.rollbackIdx < Ut; ) {
            const e = this.history[this.rollbackIdx++];
            t ? (t = false, e.state.write(this.runtime)) : e.state.read(this.runtime);
            for (let t = 0;t < 4; ++t)
              this.runtime.setGamepad(t, e.inputs[t]);
            this.runtime.update();
          }
        }
        const t = this.history[19], e = this.history.shift();
        this.history.push(e), e.frame = this.currentFrame, e.state.read(this.runtime);
        for (let s = 0;s < 4; ++s) {
          const i = this.players[s];
          let n = i.futureInputs.get(this.currentFrame);
          n != null ? (e.predicted[s] = false, i.futureInputs.delete(this.currentFrame)) : (e.predicted[s] = true, n = t.inputs[s]), e.inputs[s] = n, this.runtime.setGamepad(s, n);
        }
        this.runtime.update(), ++this.currentFrame;
      }
    }

    class Lt {
      constructor(t) {
        this.onMessage = t, this.bufferedOutput = [], this.connect(), this.keepaliveInterval = window.setInterval(() => {
          this.send("", { type: "KEEPALIVE" }, false);
        }, 15000);
      }
      async connect() {
        const t = ["wss://webrtc-signal-server.wasm4.org", "wss://ywc2h85cv1.execute-api.us-east-1.amazonaws.com/production", "wss://webrtc-signal-server.wasm4.jwq.moe", "wss://iyuavuru2h.execute-api.eu-central-1.amazonaws.com/production"];
        for (const s of t)
          try {
            this.socket = await new Promise((t, e) => {
              const i = new WebSocket(s);
              i.addEventListener("open", () => {
                t(i);
              }), i.addEventListener("error", () => {
                e();
              });
            });
            break;
          } catch (e) {
            console.error(e);
          }
        if (!this.socket)
          throw new Error("Unable to connect to signal server");
        this.socket.addEventListener("message", (t) => {
          const { source: e, message: s } = JSON.parse(t.data);
          this.onMessage(e, s);
        });
        for (const s of this.bufferedOutput)
          this.socket.send(s);
        this.bufferedOutput.length = 0;
      }
      send(t, e, s = true) {
        var i;
        const n = JSON.stringify({ target: t, message: e });
        ((i = this.socket) == null ? undefined : i.readyState) == 1 ? this.socket.send(n) : s && this.bufferedOutput.push(n);
      }
      close() {
        var t;
        (t = this.socket) == null || t.close(), window.clearInterval(this.keepaliveInterval);
      }
    }

    class Ot {
      constructor(t) {
        let e;
        this.connections = new Map, this.localPeerId = new Promise((t) => {
          e = t;
        }), this.signalClient = new Lt(async (s, i) => {
          switch (i.type) {
            case "WHOAMI_REPLY":
              this.iceServers = i.iceServers, e(i.yourPeerId);
              break;
            case "OFFER":
              if (this.connections.has(s))
                throw new Error("Received offer for a connection we already initiated");
              {
                const e = this.createConnection(s);
                await e.setRemoteDescription(i.description), await e.setLocalDescription(await e.createAnswer()), t(e, s), this.signalClient.send(s, { type: "ANSWER", description: e.localDescription.toJSON() });
              }
              break;
            case "ANSWER":
              {
                const t = this.connections.get(s);
                t && await t.setRemoteDescription(i.description);
              }
              break;
            case "CANDIDATE":
              {
                const t = this.connections.get(s);
                t && await t.addIceCandidate(new RTCIceCandidate(i.candidate));
              }
              break;
            case "ABORT": {
              const t = this.connections.get(s);
              t && t.close();
            }
          }
        }), this.signalClient.send("", { type: "WHOAMI_REQUEST" });
      }
      createConnection(t) {
        const e = new RTCPeerConnection({ iceServers: this.iceServers });
        return this.connections.set(t, e), e.addEventListener("negotiationneeded", async () => {
          await e.setLocalDescription(await e.createOffer()), this.signalClient.send(t, { type: "OFFER", description: e.localDescription.toJSON() });
        }), e.addEventListener("icecandidate", ({ candidate: e }) => {
          e && this.signalClient.send(t, { type: "CANDIDATE", candidate: e.toJSON() });
        }), e.addEventListener("connectionstatechange", () => {
          const s = e.connectionState;
          s != "connected" && s != "failed" || this.connections.delete(t);
        }), e;
      }
      connect(t) {
        return this.connections.get(t) || this.createConnection(t);
      }
      close() {
        this.signalClient.close();
        for (const [t, e] of this.connections)
          e.close();
      }
    }
    const Rt = 16384;

    class Nt {
      constructor(t) {
        this.chunks = [], this.size = 0, t.addEventListener("message", (t) => {
          if (t.data instanceof ArrayBuffer) {
            const e = new Uint8Array(t.data);
            this.size += e.byteLength, this.chunks.push(e);
          }
        });
      }
      read() {
        const t = new Uint8Array(this.size);
        let e = 0;
        for (const s of this.chunks)
          t.set(s, e), e += s.byteLength;
        return this.chunks.length = 0, this.size = 0, t;
      }
    }

    class Bt {
      constructor(t) {
        this.channel = t, this.size = 0;
      }
      write(t) {
        this.buffer || (this.buffer = new Uint8Array(Rt));
        let e = this.size, s = 0;
        for (;s < t.length; ) {
          const i = t.subarray(s, s + Rt - e);
          this.buffer.set(i, e), s += i.length, e += i.length, e >= Rt && (e -= Rt, this.channel.send(this.buffer));
        }
        this.size = e;
      }
      flush() {
        this.buffer && this.size > 0 && this.channel.send(this.buffer.subarray(0, this.size)), this.buffer = undefined;
      }
    }

    class Dt {
      constructor(t, e = 0) {
        this.buffer = t, this.position = e;
      }
      readBit() {
        const t = !!(this.buffer[this.position / 8 >>> 0] & 1 << (7 & this.position));
        return ++this.position, t;
      }
      readBits(t) {
        let e = 0;
        for (let s = 0;s < t; ++s)
          e |= +this.readBit() << s;
        return e;
      }
    }

    class Ft {
      constructor(t, e = 0) {
        this.buffer = t, this.position = e;
      }
      write1() {
        this.buffer[this.position / 8 >>> 0] |= 1 << (7 & this.position), ++this.position;
      }
      write0() {
        this.buffer[this.position / 8 >>> 0] &= ~(1 << (7 & this.position)), ++this.position;
      }
      writeBits(t, e) {
        for (let s = 0;s < e; ++s)
          t & 1 << s ? this.write1() : this.write0();
      }
    }

    class Ht {
      constructor(t = 0.125) {
        this.discount = t, this.average = 0, this.firstUpdate = true;
      }
      update(t) {
        if (this.firstUpdate)
          this.firstUpdate = false, this.average = t;
        else {
          const e = this.discount;
          this.average = (1 - e) * this.average + e * t;
        }
      }
    }
    const zt = 8 + Math.ceil(82.5), jt = new ArrayBuffer(zt);

    class Vt {
      constructor(t, e, s, i) {
        this.peerId = t, this.connection = e, this.reliableChannel = s, this.unreliableChannel = i, this.playerIdx = -1, this.frame = 0, this.nextNeededFrame = 0, this.outboundFrame = 0, this.outboundInputs = [], this.ping = new Ht, this.drift = new Ht, this.chunkReader = new Nt(s), this.chunkWriter = new Bt(s);
      }
      addOutboundInput(t, e) {
        if (this.outboundFrame == 0 && (this.outboundFrame = t), t < this.outboundFrame) {
          for (let s = this.outboundFrame - t;s > 0; --s)
            this.outboundInputs.unshift(e);
          this.outboundFrame = t;
        } else {
          const s = t - this.outboundFrame;
          if (s >= this.outboundInputs.length) {
            for (let t = this.outboundInputs.length;t < s; ++t)
              this.outboundInputs[t] = t > 0 ? this.outboundInputs[t - 1] : 0;
            this.outboundInputs[s] = e;
          }
        }
      }
      sendMessage(t) {
        this.reliableChannel.send(JSON.stringify(t));
      }
      sendUnreliableBuffer(t) {
        this.unreliableChannel.send(t);
      }
      sendPingRequest() {
        const t = new DataView(jt);
        t.setUint8(0, 2), t.setUint32(1, performance.now() >>> 0), this.sendUnreliableBuffer(new Uint8Array(jt, 0, 5));
      }
      sendPingReply(t) {
        const e = new DataView(jt);
        e.setUint8(0, 3), e.setUint32(1, t), this.sendUnreliableBuffer(new Uint8Array(jt, 0, 5));
      }
      sendTick(t) {
        const e = new DataView(jt);
        e.setUint8(0, 1), e.setUint32(1, t), e.setInt8(5, this.nextNeededFrame == 0 ? -127 : this.nextNeededFrame - t), e.setInt8(6, this.outboundFrame - t), e.setUint8(7, this.outboundInputs.length);
        const s = new Ft(new Uint8Array(jt, 8));
        let i = 0;
        for (const r of this.outboundInputs) {
          const t = i ^ r;
          i = r;
          for (let e = 0;e < 8; ++e)
            t & 1 << e && (s.write1(), s.writeBits(e, 3));
          s.write0();
        }
        const n = 8 + Math.ceil(s.position / 8);
        this.sendUnreliableBuffer(new Uint8Array(jt, 0, n));
      }
      close() {
        this.reliableChannel.close(), this.unreliableChannel.close(), this.connection.close();
      }
    }

    class Wt {
      constructor(t) {
        this.runtime = t, this.remotePlayers = new Map, this.localPlayerIdx = -1, this.updateCount = 0, this.peerMgr = new Ot(async (t, e) => {
          const s = Array.from(this.remotePlayers.keys()), i = await this.createRemotePlayer(t, e);
          i.sendMessage({ type: "WELCOME", otherPeers: s }), this.localPlayerIdx >= 0 && i.sendMessage({ type: "PLAYER_INFO", playerIdx: this.localPlayerIdx });
        });
      }
      host() {
        this.runtime.setNetplay(0), this.rollbackMgr = new Mt(1, this.runtime), this.localPlayerIdx = 0;
      }
      join(t) {
        const e = this.peerMgr.connect(t);
        this.createRemotePlayer(e, t).then((t) => {
          t.sendMessage({ type: "JOIN_REQUEST" });
        }, (t) => {
          this.runtime.blueScreen(`Failed to connect
to peer. They may
be offline?`);
        });
      }
      async getInviteLink() {
        const t = await this.peerMgr.localPeerId, e = window.location;
        if (e.protocol == "file:" || e.hostname == "localhost" || e.hostname == "127.0.0.1" || e.hostname == "wasm4.org")
          return `https://wasm4.org/netplay/#${t}`;
        const s = new URL(e.href);
        return s.searchParams.set("netplay", t), s.href;
      }
      close() {
        for (const t of this.remotePlayers.values())
          t.close();
        this.peerMgr.close();
      }
      async createRemotePlayer(t, e) {
        function s(e) {
          return new Promise((s, i) => {
            const n = t.createDataChannel("WASM-4", e);
            n.binaryType = "arraybuffer", n.onopen = () => {
              s(n);
            }, n.onerror = i;
          });
        }
        const [i, n] = await Promise.all([s({ negotiated: true, id: 0 }), s({ negotiated: true, id: 1, ordered: false, maxRetransmits: 0 })]), r = new Vt(e, t, i, n);
        this.remotePlayers.set(e, r);
        const o = () => {
          this.remotePlayers.has(e) && (this.remotePlayers.delete(e), this.onleave && r.playerIdx >= 0 && this.onleave(r.playerIdx));
        };
        return t.addEventListener("connectionstatechange", () => {
          t.connectionState == "disconnected" && o();
        }), i.addEventListener("close", o), n.addEventListener("close", o), i.addEventListener("message", async (t) => {
          if (typeof t.data != "string")
            return;
          const e = JSON.parse(t.data);
          switch (e.type) {
            case "WELCOME":
              for (const t of e.otherPeers)
                if (!this.remotePlayers.has(t)) {
                  const e = this.peerMgr.connect(t), s = await this.createRemotePlayer(e, t);
                  this.localPlayerIdx >= 0 && s.sendMessage({ type: "PLAYER_INFO", playerIdx: this.localPlayerIdx });
                }
              break;
            case "JOIN_REQUEST":
              {
                const t = this.nextPlayerIdx();
                if (t >= 4)
                  r.sendMessage({ type: "JOIN_REJECT" }), r.close();
                else {
                  r.playerIdx = t, r.chunkWriter.write(this.runtime.wasmBuffer);
                  const e = new Ct;
                  e.read(this.runtime), r.chunkWriter.write(e.toBytes()), r.chunkWriter.flush(), r.sendMessage({ type: "JOIN_REPLY", yourPlayerIdx: r.playerIdx, frame: this.rollbackMgr.currentFrame, stateOffset: this.runtime.wasmBuffer.byteLength }), this.onjoin && this.onjoin(r.playerIdx);
                }
              }
              break;
            case "JOIN_REPLY":
              {
                this.localPlayerIdx = e.yourPlayerIdx;
                for (const e of this.remotePlayers.values())
                  e != r && e.sendMessage({ type: "PLAYER_INFO", playerIdx: this.localPlayerIdx });
                const t = r.chunkReader.read(), s = t.subarray(0, e.stateOffset), i = t.subarray(e.stateOffset);
                await this.runtime.load(s, false);
                const n = new Ct;
                n.fromBytes(i), n.write(this.runtime), this.runtime.setNetplay(this.localPlayerIdx), this.rollbackMgr = new Mt(e.frame, this.runtime), this.onstart && this.onstart(this.localPlayerIdx);
              }
              break;
            case "JOIN_REJECT":
              this.runtime.blueScreen(`Connected, but the
game is already
full!`), this.close();
              break;
            case "PLAYER_INFO":
              r.playerIdx == -1 && (r.playerIdx = e.playerIdx, this.onjoin && this.onjoin(r.playerIdx));
          }
        }), n.addEventListener("message", async (t) => {
          const e = t.data, s = new DataView(e);
          switch (s.getUint8(0)) {
            case 1:
              if (this.rollbackMgr && r.playerIdx >= 0) {
                const t = s.getUint32(1);
                if (t > r.frame) {
                  const i = s.getInt8(5) + t, n = s.getInt8(6) + t, o = s.getUint8(7), a = new Dt(new Uint8Array(e, 8)), l = new Array(o);
                  let h = 0;
                  for (let t = 0;t < o; ++t) {
                    for (;a.readBit(); ) {
                      h ^= 1 << a.readBits(3);
                    }
                    l[t] = h;
                  }
                  if (r.frame = t, r.nextNeededFrame = n + l.length, r.outboundFrame == 0)
                    r.outboundFrame = i;
                  else if (i > r.outboundFrame) {
                    const t = i - r.outboundFrame;
                    r.outboundFrame = i, r.outboundInputs.splice(0, t);
                  }
                  const c = t + 0.5 * r.ping.average * 60 / 1000, d = this.rollbackMgr.currentFrame - c;
                  r.drift.update(d), this.rollbackMgr.addInputs(r.playerIdx, n, l);
                }
              }
              break;
            case 2:
              {
                const t = s.getUint32(1);
                r.sendPingReply(t);
              }
              break;
            case 3: {
              const t = s.getUint32(1), e = (performance.now() >>> 0) - t;
              r.ping.update(e);
            }
          }
        }), r;
      }
      nextPlayerIdx() {
        t:
          for (let t = 0;t < 4; ++t)
            if (this.localPlayerIdx != t) {
              for (const e of this.remotePlayers.values())
                if (e.playerIdx == t)
                  continue t;
              return t;
            }
        return -1;
      }
      update(t) {
        if (!this.rollbackMgr)
          return false;
        const e = (7 & this.updateCount) == 0, s = (31 & this.updateCount) == 0;
        ++this.updateCount;
        const i = this.rollbackMgr.currentFrame, n = i + 2;
        this.rollbackMgr.addInputs(this.localPlayerIdx, n, [t]);
        let r = false;
        for (const o of this.remotePlayers.values())
          o.addOutboundInput(n, t), o.sendTick(i), (o.nextNeededFrame < i - Ut || o.outboundInputs.length >= 20) && (r = true), s && o.sendPingRequest();
        if (e) {
          let t = 0;
          for (const e of this.remotePlayers.values())
            t = Math.max(e.drift.average, t);
          t >= 1 && (r = true);
        }
        return r || this.rollbackMgr.update(), !r;
      }
      getSummary() {
        const t = [{ playerIdx: this.localPlayerIdx, ping: -1 }];
        for (const e of this.remotePlayers.values())
          t.push({ playerIdx: e.playerIdx, ping: e.ping.average });
        return t.sort((t, e) => t.playerIdx - e.playerIdx), t;
      }
    }
    const Gt = '"use strict";(()=>{var M=Math.floor(44.1),b=class{constructor(){this.freq1=0;this.freq2=0;this.startTime=0;this.attackTime=0;this.decayTime=0;this.sustainTime=0;this.releaseTime=0;this.endTick=0;this.sustainVolume=0;this.peakVolume=0;this.phase=0;this.pan=0;this.pulseDutyCycle=0;this.noiseSeed=1;this.noiseLastRandom=0}};function L(m,e,s){return m+s*(e-m)}function V(m,e){if(m<e){let s=m/e;return s+s-s*s}else if(m>1-e){let s=(m-(1-e))/e;return 1-(s+s-s*s)}else return 1}function x(m,e){return Math.pow(2,(m-69+e/256)/12)*440}var y=class extends AudioWorkletProcessor{constructor(){super(),this.time=0,this.ticks=0,this.channels=new Array(4);for(let e=0;e<4;++e)this.channels[e]=new b;this.port!=null&&(this.port.onmessage=e=>{e.data==="tick"?this.tick():this.tone(...e.data)})}ramp(e,s,f,u){if(this.time>=u)return s;let a=(this.time-f)/(u-f);return L(e,s,a)}getCurrentFrequency(e){return e.freq2>0?this.ramp(e.freq1,e.freq2,e.startTime,e.releaseTime):e.freq1}getCurrentVolume(e){let s=this.time;return s>=e.sustainTime&&e.releaseTime-e.sustainTime>M?this.ramp(e.sustainVolume,0,e.sustainTime,e.releaseTime):s>=e.decayTime?e.sustainVolume:s>=e.attackTime?this.ramp(e.peakVolume,e.sustainVolume,e.attackTime,e.decayTime):this.ramp(0,e.peakVolume,e.startTime,e.attackTime)}tick(){this.ticks++}tone(e,s,f,u){let a=e&65535,p=e>>16&65535,A=s&255,h=s>>8&255,o=s>>16&255,i=s>>24&255,E=Math.min(f&255,100),l=Math.min(f>>8&255,100),n=u&3,r=u>>2&3,c=u>>4&3,d=u&64,t=this.channels[n];this.time>t.releaseTime&&this.ticks!=t.endTick&&(t.phase=n==2?.25:0),d?(t.freq1=x(a&255,a>>8),t.freq2=p==0?0:x(p&255,p>>8)):(t.freq1=a,t.freq2=p),t.startTime=this.time,t.attackTime=t.startTime+(44100*i/60>>>0),t.decayTime=t.attackTime+(44100*o/60>>>0),t.sustainTime=t.decayTime+(44100*A/60>>>0),t.releaseTime=t.sustainTime+(44100*h/60>>>0),t.endTick=this.ticks+i+o+A+h,t.pan=c;let T=n==2?.25:.15;if(t.sustainVolume=T*E/100,t.peakVolume=l?T*l/100:T,n==0||n==1)switch(r){case 0:t.pulseDutyCycle=.125;break;case 1:case 3:default:t.pulseDutyCycle=.25;break;case 2:t.pulseDutyCycle=.5;break}else n==2&&h==0&&(t.releaseTime+=M)}process(e,[[s,f]],u){for(let a=0,p=s.length;a<p;++a,++this.time){let A=0,h=0;for(let o=0;o<4;++o){let i=this.channels[o];if(this.time<i.releaseTime||this.ticks==i.endTick){let E=this.getCurrentFrequency(i),l=this.getCurrentVolume(i),n;if(o==3){for(i.phase+=E*E/(1e6/44100*44100);i.phase>0;){i.phase--;let r=i.noiseSeed;r^=r>>7,r^=r<<9,r^=r>>13,i.noiseSeed=r,i.noiseLastRandom=((r&1)<<1)-1}n=l*i.noiseLastRandom}else{let r=E/44100,c=i.phase+r;if(c>=1&&c--,i.phase=c,o==2)n=l*(2*Math.abs(2*i.phase-1)-1);else{let d,t,T,k=i.pulseDutyCycle;c<k?(d=c/k,t=r/k,T=l):(d=(c-k)/(1-k),t=r/(1-k),T=-l),n=T*V(d,t)}}i.pan!=1&&(h+=n),i.pan!=2&&(A+=n)}}s[a]=A,f[a]=h}return!0}};registerProcessor("wasm4-apu",y);})();\n';

    class Kt {
      constructor() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });
      }
      async init() {
        const t = this.audioCtx, e = new Blob([Gt], { type: "application/javascript" }), s = URL.createObjectURL(e);
        try {
          await t.audioWorklet.addModule(s);
          const e = new AudioWorkletNode(t, "wasm4-apu", { outputChannelCount: [2] });
          this.processorPort = e.port, e.connect(t.destination);
        } catch (i) {
          if (t.state !== "closed")
            throw i;
        } finally {
          URL.revokeObjectURL(s);
        }
      }
      tick() {
        this.processorPort != null ? this.processorPort.postMessage("tick") : this.processor.tick();
      }
      tone(t, e, s, i) {
        this.processorPort != null ? this.processorPort.postMessage([t, e, s, i]) : this.processor.tone(t, e, s, i);
      }
      unlockAudio() {
        const t = this.audioCtx;
        t.state == "suspended" && t.resume();
      }
      pauseAudio() {
        const t = this.audioCtx;
        t.state == "running" && t.suspend();
      }
    }

    class qt {
      constructor(t) {
        this.bytes = new Uint8Array(t, 160, 6400), this.drawColors = new Uint16Array(t, 20, 1);
      }
      clear() {
        this.bytes.fill(0);
      }
      drawPoint(t, e, s) {
        const i = ft * s + e >>> 2, n = (3 & e) << 1, r = 3 << n;
        this.bytes[i] = t << n | this.bytes[i] & ~r;
      }
      drawPointUnclipped(t, e, s) {
        e >= 0 && e < ft && s >= 0 && s < mt && this.drawPoint(t, e, s);
      }
      drawHLineFast(t, e, s, i) {
        const n = i - (3 & i), r = Math.min(e + 3 & -4, n);
        if (n - r > 3) {
          for (let n = e;n < r; n++)
            this.drawPoint(t, n, s);
          const i = ft * s + r >>> 2, o = ft * s + n >>> 2, a = 85 * t;
          this.bytes.fill(a, i, o), e = n;
        }
        for (let o = e;o < i; o++)
          this.drawPoint(t, o, s);
      }
      drawHLineUnclipped(t, e, s, i) {
        s >= 0 && s < mt && (e < 0 && (e = 0), i > ft && (i = ft), e < i && this.drawHLineFast(t, e, s, i));
      }
      drawHLine(t, e, s) {
        const i = 15 & this.drawColors[0];
        if (i == 0)
          return;
        const n = i - 1 & 3;
        this.drawHLineUnclipped(n, t, e, t + s);
      }
      drawVLine(t, e, s) {
        if (e + s <= 0 || t < 0 || t >= ft)
          return;
        const i = 15 & this.drawColors[0];
        if (i == 0)
          return;
        const n = Math.max(0, e), r = Math.min(mt, e + s), o = i - 1 & 3;
        for (let a = n;a < r; a++)
          this.drawPoint(o, t, a);
      }
      drawRect(t, e, s, i) {
        const n = Math.max(0, t), r = Math.max(0, e), o = t + s, a = e + i, l = Math.max(0, Math.min(o, ft)), h = Math.max(0, Math.min(a, mt)), c = this.drawColors[0], d = 15 & c, u = c >>> 4 & 15;
        if (d !== 0) {
          const t = d - 1 & 3;
          for (let e = r;e < h; ++e)
            this.drawHLineFast(t, n, e, l);
        }
        if (u !== 0) {
          const s = u - 1 & 3;
          if (t >= 0 && t < ft)
            for (let e = r;e < h; ++e)
              this.drawPoint(s, t, e);
          if (o > 0 && o <= ft)
            for (let t = r;t < h; ++t)
              this.drawPoint(s, o - 1, t);
          e >= 0 && e < mt && this.drawHLineFast(s, n, e, l), a > 0 && a <= mt && this.drawHLineFast(s, n, a - 1, l);
        }
      }
      drawOval(t, e, s, i) {
        const n = this.drawColors[0], r = 15 & n, o = n >>> 4 & 15;
        if (o === 15)
          return;
        const a = o - 1 & 3, l = r - 1 & 3;
        let h = s - 1;
        const c = i - 1;
        let d = c % 2, u = e + Math.floor(i / 2), p = t, f = t + s - 1, m = u - d;
        const y = h * h, w = c * c;
        let g = 4 * (1 - h) * w, b = 4 * (d + 1) * y, v = g + b + d * y;
        h = 8 * y, d = 8 * w;
        do {
          this.drawPointUnclipped(a, f, u), this.drawPointUnclipped(a, p, u), this.drawPointUnclipped(a, p, m), this.drawPointUnclipped(a, f, m);
          const t = p + 1;
          r !== 0 && f - t > 0 && (this.drawHLineUnclipped(l, t, u, f), this.drawHLineUnclipped(l, t, m, f));
          const e = 2 * v;
          e <= b && (u += 1, m -= 1, b += h, v += b), (e >= g || e > b) && (p += 1, f -= 1, g += d, v += g);
        } while (p <= f);
        for (;u - m < i; )
          this.drawPointUnclipped(a, p - 1, u), this.drawPointUnclipped(a, f + 1, u), u += 1, this.drawPointUnclipped(a, p - 1, m), this.drawPointUnclipped(a, f + 1, m), m -= 1;
      }
      drawLine(t, e, s, i) {
        const n = 15 & this.drawColors[0];
        if (n === 0)
          return;
        const r = n - 1 & 3;
        if (e > i) {
          let n = t;
          t = s, s = n, n = e, e = i, i = n;
        }
        const o = Math.abs(s - t), a = t < s ? 1 : -1, l = i - e;
        let h, c = (o > l ? o : -l) / 2;
        for (;this.drawPointUnclipped(r, t, e), t !== s || e !== i; )
          h = c, h > -o && (c -= l, t += a), h < l && (c += o, e++);
      }
      drawText(t, e, s) {
        let i = e;
        for (let n = 0, r = t.length;n < r; ++n) {
          const r = t[n];
          if (r === 0)
            return;
          r === 10 ? (s += 8, i = e) : r >= 32 && r <= 255 ? (this.blit(xt, i, s, 8, 8, 0, r - 32 << 3, 8), i += 8) : i += 8;
        }
      }
      blit(t, e, s, i, n, r, o, a, l = false, h = false, c = false, d = false) {
        const u = this.drawColors[0];
        let p, f, m, y;
        d ? (h = !h, p = Math.max(0, s) - s, f = Math.max(0, e) - e, m = Math.min(i, mt - s), y = Math.min(n, ft - e)) : (p = Math.max(0, e) - e, f = Math.max(0, s) - s, m = Math.min(i, ft - e), y = Math.min(n, mt - s));
        for (let w = f;w < y; w++)
          for (let f = p;f < m; f++) {
            const p = e + (d ? w : f), m = s + (d ? f : w);
            let y;
            const g = (o + (c ? n - w - 1 : w)) * a + (r + (h ? i - f - 1 : f));
            if (l) {
              y = t[g >>> 2] >>> 6 - ((3 & g) << 1) & 3;
            } else {
              y = t[g >>> 3] >>> 7 - (7 & g) & 1;
            }
            const b = u >>> (y << 2) & 15;
            b !== 0 && this.drawPoint(b - 1 & 3, p, m);
          }
      }
    }
    const Yt = 6409, Jt = 3553;

    class Xt {
      constructor(t) {
        this.gl = t, this.colorBuffer = new Uint32Array(6400), this.paletteBuffer = new Float32Array(12), this.lastPalette = Array(4), this.paletteLocation = null;
        const e = new Uint32Array(256);
        for (let i = 0;i < 256; ++i) {
          const t = i >> 6 & 3, s = i >> 4 & 3, n = i >> 2 & 3, r = 3 & i;
          e[i] = t << 30 | s << 22 | n << 14 | r << 6;
        }
        this.table = e;
        const s = t.canvas;
        s.addEventListener("webglcontextlost", (t) => {
          t.preventDefault();
        }), s.addEventListener("webglcontextrestored", () => {
          this.initGL();
        }), this.initGL();
      }
      initGL() {
        const t = this.gl;
        function e(e, s) {
          const i = t.createShader(e);
          if (t.shaderSource(i, s), t.compileShader(i), !t.getShaderParameter(i, 35713))
            throw new Error(t.getShaderInfoLog(i) + "");
          return i;
        }
        this.lastPalette = Array(4);
        const s = e(35633, `
            attribute vec2 pos;
            varying vec2 framebufferCoord;

            void main () {
                framebufferCoord = pos*vec2(0.5, -0.5) + 0.5;
                gl_Position = vec4(pos, 0, 1);
            }
        `), i = e(35632, `
            precision mediump float;
            uniform vec3 palette[4];
            uniform sampler2D framebuffer;
            varying vec2 framebufferCoord;

            vec3 lookup(float index) {
                vec3 p = palette[0];
                ${Array.from({ length: 3 }, (t, e) => `p = mix(p, palette[${e + 1}],  step(${((e + 1) / 4).toFixed(2)}, index));`).join(`
`)}
                return p;
            }

            void main () {
                gl_FragColor = vec4(lookup(texture2D(framebuffer, framebufferCoord).r), 1.);
            }
        `), n = t.createProgram();
        if (t.attachShader(n, s), t.attachShader(n, i), t.linkProgram(n), !t.getProgramParameter(n, 35714))
          throw new Error(t.getProgramInfoLog(n) + "");
        t.useProgram(n), this.paletteLocation = t.getUniformLocation(n, "palette"), t.uniform1i(t.getUniformLocation(n, "framebuffer"), 0), t.detachShader(n, s), t.deleteShader(s), t.detachShader(n, i), t.deleteShader(i), function(e) {
          const s = t.createTexture();
          t.activeTexture(e), t.bindTexture(Jt, s), t.texParameteri(Jt, 10242, 33071), t.texParameteri(Jt, 10243, 33071), t.texParameteri(Jt, 10240, 9728), t.texParameteri(Jt, 10241, 9728);
        }(33984), t.texImage2D(Jt, 0, Yt, ft, mt, 0, Yt, 5121, null);
        const r = t.getAttribLocation(n, "pos"), o = t.createBuffer(), a = new Float32Array([-1, -1, -1, 1, 1, 1, 1, 1, 1, -1, -1, -1]);
        t.bindBuffer(34962, o), t.bufferData(34962, a, 35044), t.enableVertexAttribArray(r), t.vertexAttribPointer(r, 2, 5126, false, 0, 0);
      }
      composite(t, e) {
        const s = this.gl, i = e.bytes, n = this.colorBuffer, r = this.table, o = this.lastPalette, a = this.paletteBuffer;
        let l = false;
        for (let h = 0, c = 0;h < 4; ++h) {
          const e = t[h];
          l = l || o[h] !== e, a[c++] = (e >> 16 & 255) / 255, a[c++] = (e >> 8 & 255) / 255, a[c++] = (255 & e) / 255, o[h] = e;
        }
        l && s.uniform3fv(this.paletteLocation, this.paletteBuffer);
        for (let h = 0;h < 6400; ++h)
          n[h] = r[i[h]];
        s.texImage2D(Jt, 0, Yt, ft, mt, 0, Yt, 5121, new Uint8Array(n.buffer)), s.drawArrays(4, 0, 6);
      }
    }
    function Zt(t, e) {
      const s = e.reduce((t, e) => t + (e[0] === 0 ? e[2] - e[1] : e[1].length), 0), i = new Uint8Array(s);
      let n = 0;
      for (const r of e)
        r[0] === 0 ? (i.set(t.slice(r[1], r[2]), n), n += r[2] - r[1]) : (i.set(r[1], n), n += r[1].length);
      return i;
    }
    function Qt(t) {
      const e = [];
      do {
        const s = 127 & t;
        t >>= 7, e.push(t ? 128 | s : s);
      } while (t);
      return new Uint8Array(e);
    }
    function te(t, e = 0) {
      let s = 0, i = 0, n = 0;
      do {
        s = t[e++], i |= (127 & s) << n, n += 7;
      } while (128 & s);
      return [i, e];
    }

    class ee {
      constructor(t) {
        this.wasmBuffer = null, this.wasm = null, this.warnedFileSize = false;
        const e = document.createElement("canvas");
        e.width = ft, e.height = mt, this.canvas = e;
        const s = e.getContext("webgl", { alpha: false, depth: false, antialias: false });
        if (!s)
          throw new Error("web-runtime: could not create wegl context");
        let i;
        this.compositor = new Xt(s), this.apu = new Kt, this.diskName = t, this.diskBuffer = new ArrayBuffer(yt);
        try {
          i = localStorage.getItem(t);
        } catch (n) {
          console.error("Error reading disk", n);
        }
        this.diskSize = i != null ? Pt(i, new Uint8Array(this.diskBuffer)) : 0, this.memory = new WebAssembly.Memory({ initial: 1, maximum: 1 }), this.data = new DataView(this.memory.buffer), this.framebuffer = new qt(this.memory.buffer), this.reset(), this.pauseState = 0, this.wasmBufferByteLen = 0;
      }
      async init() {
        await this.apu.init();
      }
      setMouse(t, e, s) {
        this.data.setInt16(26, t, true), this.data.setInt16(28, e, true), this.data.setUint8(30, s);
      }
      setGamepad(t, e) {
        this.data.setUint8(22 + t, e);
      }
      setNetplay(t) {
        this.data.setUint8(32, 4 | 3 & t);
      }
      getSystemFlag(t) {
        return this.data.getUint8(31) & t;
      }
      unlockAudio() {
        this.apu.unlockAudio();
      }
      pauseAudio() {
        this.apu.pauseAudio();
      }
      reset(t) {
        const e = new Uint32Array(this.memory.buffer);
        t && e.fill(0), this.pauseState &= -2, e.set(wt, 1), this.data.setUint16(20, 4611, true), this.data.setInt16(26, 32767, true), this.data.setInt16(28, 32767, true);
      }
      async load(t, e = true) {
        if (this.wasmBuffer = t, this.wasmBufferByteLen = t.byteLength, this.wasm = null, t.byteLength > 65536 && e)
          throw new Error("Cart too big!");
        const s = { memory: this.memory, rect: this.framebuffer.drawRect.bind(this.framebuffer), oval: this.framebuffer.drawOval.bind(this.framebuffer), line: this.framebuffer.drawLine.bind(this.framebuffer), hline: this.framebuffer.drawHLine.bind(this.framebuffer), vline: this.framebuffer.drawVLine.bind(this.framebuffer), text: this.text.bind(this), textUtf8: this.textUtf8.bind(this), textUtf16: this.textUtf16.bind(this), blit: this.blit.bind(this), blitSub: this.blitSub.bind(this), tone: this.apu.tone.bind(this.apu), diskr: this.diskr.bind(this), diskw: this.diskw.bind(this), trace: this.trace.bind(this), traceUtf8: this.traceUtf8.bind(this), traceUtf16: this.traceUtf16.bind(this), tracef: this.tracef.bind(this) };
        await this.bluescreenOnError(async () => {
          const e = function(t) {
            const e = new DataView(t.buffer), s = e.getUint32(0), i = e.getUint32(4, true);
            if (s !== 6386541 || i !== 1)
              throw new Error("Invalid WASM binary");
            let n = 8;
            const r = [];
            let o, a = 0, l = 0;
            for (;n < t.byteLength; ) {
              const e = t[n], s = n;
              [o, n] = te(t, n + 1);
              const i = n + o;
              let h = n;
              if (n += o, e === 6)
                a += te(t, h)[0];
              else if (e === 7) {
                r.push([0, l, s]), l = i;
                const e = new Set, n = [];
                let o, c, d;
                [o, h] = te(t, h);
                for (let s = 0;s < o; s++) {
                  const s = h;
                  [c, h] = te(t, h), h += c;
                  const i = t[h++];
                  [d, h] = te(t, h), i === 3 && e.add(d), n.push([0, s, h]);
                }
                for (let t = 0;t < a; t++)
                  if (!e.has(t)) {
                    const e = new TextEncoder().encode(`__global_${t}`), s = Qt(e.length), i = Qt(t), r = new Uint8Array(e.length + s.length + i.length + 1);
                    r.set(s), r.set(e, s.length), r[s.length + e.length] = 3, r.set(i, s.length + e.length + 1), n.push([1, r]);
                  }
                const u = Qt(n.length), p = Zt(t, n), f = Qt(u.length + p.length);
                r.push([1, new Uint8Array([7])]), r.push([1, f]), r.push([1, u]), r.push([1, p]);
              }
            }
            return r.push([0, l, n]), Zt(t, r);
          }(t), i = await WebAssembly.instantiate(e, { env: s });
          this.wasm = i.instance, typeof this.wasm.exports._start == "function" && this.wasm.exports._start(), typeof this.wasm.exports._initialize == "function" && this.wasm.exports._initialize();
        });
      }
      async bluescreenOnError(t) {
        try {
          await t();
        } catch (e) {
          if (e instanceof Error) {
            const t = function(t) {
              if (t instanceof WebAssembly.RuntimeError) {
                let e;
                return t.message.match(/unreachable/) ? e = `The cartridge has
reached a code 
segment marked as
unreachable.` : t.message.match(/out of bounds/) && (e = `The cartridge has
attempted a memory
access that is
out of bounds.`), e + `




Hit R to reboot.`;
              }
              if (t instanceof WebAssembly.LinkError)
                return `The cartridge has
tried to import
a missing function.



See console for
more details.`;
              if (t instanceof WebAssembly.CompileError)
                return `The cartridge is
corrupted.



See console for
more details.`;
              if (t instanceof se)
                return t.wasm4Message;
              return `Unknown error.



See console for
more details.`;
            }(e);
            this.blueScreen(t), this.printToServer(e.stack ?? "");
          }
          throw e;
        }
      }
      text(t, e, s) {
        const i = new Uint8Array(this.memory.buffer, t);
        this.framebuffer.drawText(i, e, s);
      }
      textUtf8(t, e, s, i) {
        const n = new Uint8Array(this.memory.buffer, t, e);
        this.framebuffer.drawText(n, s, i);
      }
      textUtf16(t, e, s, i) {
        const n = new Uint16Array(this.memory.buffer, t, e >> 1);
        this.framebuffer.drawText(n, s, i);
      }
      blit(t, e, s, i, n, r) {
        this.blitSub(t, e, s, i, n, 0, 0, i, r);
      }
      blitSub(t, e, s, i, n, r, o, a, l) {
        const h = new Uint8Array(this.memory.buffer, t), c = 1 & l, d = 2 & l, u = 4 & l, p = 8 & l;
        this.framebuffer.blit(h, e, s, i, n, r, o, a, c, d, u, p);
      }
      diskr(t, e) {
        const s = Math.min(e, this.diskSize), i = new Uint8Array(this.diskBuffer, 0, s);
        return new Uint8Array(this.memory.buffer, t).set(i), s;
      }
      diskw(t, e) {
        const s = Math.min(e, yt), i = new Uint8Array(this.memory.buffer, t, s), n = new Uint8Array(this.diskBuffer), r = _t(i);
        try {
          localStorage.setItem(this.diskName, r);
        } catch (o) {
          console.error("Error writing disk", o);
        }
        return n.set(i), this.diskSize = s, s;
      }
      getCString(t) {
        let e = "";
        for (;; ) {
          const s = this.data.getUint8(t++);
          if (s == 0)
            break;
          e += String.fromCharCode(s);
        }
        return e;
      }
      print(t) {
        console.log(t), this.printToServer(t);
      }
      printToServer(t) {}
      trace(t) {
        this.print(this.getCString(t));
      }
      traceUtf8(t, e) {
        const s = new Uint8Array(this.memory.buffer, t, e), i = new TextDecoder().decode(s);
        this.print(i);
      }
      traceUtf16(t, e) {
        const s = new Uint8Array(this.memory.buffer, t, e), i = new TextDecoder("utf-16").decode(s);
        this.print(i);
      }
      tracef(t, e) {
        let s, i = "";
        for (;s = this.data.getUint8(t++); )
          if (s == 37)
            switch (s = this.data.getUint8(t++)) {
              case 37:
                i += "%";
                break;
              case 99:
                i += String.fromCharCode(this.data.getInt32(e, true)), e += 4;
                break;
              case 100:
              case 120:
                i += this.data.getInt32(e, true).toString(s == 100 ? 10 : 16), e += 4;
                break;
              case 115:
                i += this.getCString(this.data.getUint32(e, true)), e += 4;
                break;
              case 102:
                i += this.data.getFloat64(e, true), e += 8;
                break;
              default:
                i += "%" + String.fromCharCode(s);
            }
          else
            i += String.fromCharCode(s);
        this.print(i);
      }
      start() {
        let t = this.wasm.exports.start;
        typeof t == "function" && this.bluescreenOnError(t);
      }
      update() {
        if (this.pauseState != 0)
          return;
        this.getSystemFlag(1) || this.framebuffer.clear();
        let t = this.wasm.exports.update;
        typeof t == "function" && this.bluescreenOnError(t), this.apu.tick();
      }
      blueScreen(t) {
        this.pauseState |= 1;
        const e = (t) => [...t].map((t) => t.charCodeAt(0)), s = " WASM-4 ", i = s;
        new Uint32Array(this.memory.buffer).set([1118702, 8831084, 11184810, 16777215], 1), this.data.setUint16(20, 4611, true), this.framebuffer.clear(), this.framebuffer.drawHLine(48, 19, 64), this.data.setUint16(20, 4401, true), this.framebuffer.drawText(e(i), 48, 20), this.data.setUint16(20, 4611, true), this.framebuffer.drawText(e(t), 9, 60), this.composite();
      }
      composite() {
        const t = new Uint32Array(this.memory.buffer, 4, 4);
        this.compositor.composite(t, this.framebuffer);
      }
    }

    class se extends Error {
      constructor(t) {
        super(t.replace(`
`, " ")), this.name = "Wasm4Error", this.wasm4Message = t;
      }
    }
    var { defineProperty: ie, getOwnPropertyDescriptor: ne } = Object, re = (t, e, s, i) => {
      for (var n, r = i > 1 ? undefined : i ? ne(e, s) : e, o = t.length - 1;o >= 0; o--)
        (n = t[o]) && (r = (i ? n(e, s, r) : n(r)) || r);
      return i && r && ie(e, s, r), r;
    };

    class oe {
      constructor() {
        this.gamepad = [0, 0, 0, 0], this.mouseX = 0, this.mouseY = 0, this.mouseButtons = 0;
      }
    }
    function* ae(t, e) {
      if (t !== undefined) {
        let s = 0;
        for (const i of t)
          yield e(i, s++);
      }
    }
    t.App = class extends ot {
      constructor() {
        super();
        this.inputState = new oe;
        this.hideGamepadOverlay = true;
        this.stopped = false;
        this.visible = true;
        this.ready = false;
        this.audioUnlocked = false;
        this.frame = null;
        this.audioTask = Promise.resolve();
        this.cleanups = [];
      }
      async startCart(bytes, diskPrefix) {
        this.diskPrefix = diskPrefix;
        this.runtime = new ee(`${diskPrefix}-disk`);
        const t = this.runtime;
        this.syncAudio();
        try {
          await t.init();
          if (this.stopped)
            return;
          await t.load(bytes);
          if (this.stopped)
            return;
          t.start();
          if (t.pauseState)
            throw Error("Cart start failed");
          const listen = (name, fn) => {
            this.addEventListener(name, fn);
            this.cleanups.push(() => this.removeEventListener(name, fn));
          };
          listen("keydown", (e) => {
            const mask = { ArrowLeft: gt, ArrowRight: bt, ArrowUp: vt, ArrowDown: At, KeyX: 1, KeyZ: 2, Space: 1 }[e.code];
            if (mask && this.visible) {
              e.preventDefault();
              this.inputState.gamepad[0] |= mask;
              this.unlockAudio();
            }
          });
          listen("keyup", (e) => {
            const mask = { ArrowLeft: gt, ArrowRight: bt, ArrowUp: vt, ArrowDown: At, KeyX: 1, KeyZ: 2, Space: 1 }[e.code];
            if (mask) {
              e.preventDefault();
              this.inputState.gamepad[0] &= ~mask;
            }
          });
          listen("blur", () => this.inputState.gamepad.fill(0));
          listen("pointerdown", () => {
            if (!this.visible)
              return;
            this.hideGamepadOverlay = false;
            this.setAttribute("gamepad", "");
            this.focus();
            this.unlockAudio();
          });
          this.lastFrame = 0;
          this.tick = (now) => {
            this.frame = null;
            if (this.stopped || !this.visible)
              return;
            if (now - this.lastFrame >= 1000 / 60) {
              this.lastFrame = now;
              for (let i = 0;i < 4; i++)
                t.setGamepad(i, this.inputState.gamepad[i]);
              t.update();
              t.composite();
            }
            this.scheduleFrame();
          };
          this.ready = true;
          this.scheduleFrame();
          this.syncAudio();
          this.requestUpdate();
        } finally {
          if (this.stopped)
            this.dispose();
        }
      }
      setVisible(visible) {
        if (this.stopped)
          return;
        this.visible = visible;
        if (!visible) {
          cancelAnimationFrame(this.frame);
          this.frame = null;
          this.inputState.gamepad.fill(0);
        } else {
          this.lastFrame = 0;
          this.scheduleFrame();
        }
        this.syncAudio();
      }
      scheduleFrame() {
        if (this.ready && this.visible && !this.stopped && this.frame === null)
          this.frame = requestAnimationFrame(this.tick);
      }
      unlockAudio() {
        if (!this.visible || this.stopped)
          return;
        this.audioUnlocked = true;
        this.syncAudio();
      }
      syncAudio() {
        this.audioTask = this.audioTask.then(async () => {
          const ctx = this.runtime?.apu.audioCtx;
          if (!ctx || this.stopped || ctx.state === "closed")
            return;
          if (ctx.state === "running")
            this.audioUnlocked = true;
          if (!this.visible && ctx.state !== "suspended")
            await ctx.suspend();
          else if (this.visible && this.audioUnlocked && ctx.state === "suspended")
            await ctx.resume();
        }).catch((error) => {
          if (!this.stopped)
            console.error("Stage audio visibility failed", error);
        });
      }
      dispose() {
        this.stopped = true;
        this.ready = false;
        cancelAnimationFrame(this.frame);
        this.frame = null;
        this.cleanups.splice(0).forEach((fn) => fn());
        if (this.runtime) {
          this.runtime.pauseState = 1;
          if (this.runtime.apu.audioCtx.state !== "closed")
            this.runtime.apu.audioCtx.close().catch(() => {});
        }
      }
      disconnectedCallback() {
        this.dispose();
        super.disconnectedCallback();
      }
      onMenuButtonPressed() {}
      render() {
        return j`<div class="content">${this.runtime ? this.runtime.canvas : ""}</div><wasm4-virtual-gamepad .app="${this}"></wasm4-virtual-gamepad>`;
      }
    };
    t.App.styles = a`:host{display:block;position:relative;touch-action:none;outline-offset:2px;width:100%;height:calc(var(--cart-scale,1)*160px + 240px)}.content{width:calc(var(--cart-scale,1)*160px);height:calc(var(--cart-scale,1)*160px);margin:auto}.content canvas{width:100%;height:100%;image-rendering:pixelated}wasm4-virtual-gamepad{display:none;position:absolute;inset:0} :host([gamepad]) wasm4-virtual-gamepad{display:block}`;
    re([dt()], t.App.prototype, "hideGamepadOverlay", 2);
    t.App = re([lt("wasm4-app")], t.App);
    var { defineProperty: le, getOwnPropertyDescriptor: he } = Object, ce = (t, e, s, i) => {
      for (var n, r = i > 1 ? undefined : i ? he(e, s) : e, o = t.length - 1;o >= 0; o--)
        (n = t[o]) && (r = (i ? n(e, s, r) : n(r)) || r);
      return i && r && le(e, s, r), r;
    };
    const de = 0, ue = 1, pe = [{ CONTINUE: 0, SAVE_STATE: 1, LOAD_STATE: 2, DISK_OPTIONS: 3, COPY_NETPLAY_LINK: 4, RESET_CART: 5 }, { BACK: 0, EXPORT_DISK: 1, IMPORT_DISK: 2, CLEAR_DISK: 3 }], fe = [["CONTINUE", "SAVE STATE", "LOAD STATE", "DISK OPTIONS", "COPY NETPLAY URL", "RESET CART"], ["BACK", "EXPORT DISK", "IMPORT DISK", "CLEAR DISK"]];
    t.MenuOverlay = class extends ot {
      constructor() {
        super(), this.lastGamepad = 0, this.selectedIdx = 0, this.netplaySummary = [], this.optionContext = 0, this.optionContextHistory = [];
      }
      get optionIndex() {
        return pe[this.optionContext];
      }
      get options() {
        return fe[this.optionContext];
      }
      previousContext() {
        if (this.optionContextHistory.length > 0) {
          const t = this.optionContextHistory.pop();
          this.resetInput(), this.optionContext = t.context, this.selectedIdx = t.index;
        }
      }
      switchContext(t, e = 0) {
        this.optionContextHistory.push({ context: this.optionContext, index: this.selectedIdx }), this.resetInput(), this.optionContext = t, this.selectedIdx = e;
      }
      resetInput() {
        this.app.inputState.gamepad[0] = 0;
      }
      applyInput() {
        let t = 0;
        for (const s of this.app.inputState.gamepad)
          t |= s;
        const e = t & (t ^ this.lastGamepad);
        if (this.lastGamepad = t, 3 & e) {
          if (this.optionContext === de)
            switch (this.selectedIdx) {
              case this.optionIndex.CONTINUE:
                this.app.closeMenu();
                break;
              case this.optionIndex.SAVE_STATE:
                this.app.saveGameState(), this.app.closeMenu();
                break;
              case this.optionIndex.LOAD_STATE:
                this.app.loadGameState(), this.app.closeMenu();
                break;
              case this.optionIndex.DISK_OPTIONS:
                this.switchContext(ue);
                break;
              case this.optionIndex.COPY_NETPLAY_LINK:
                this.app.copyNetplayLink(), this.app.closeMenu();
                break;
              case this.optionIndex.RESET_CART:
                this.app.resetCart(), this.app.closeMenu();
            }
          else if (this.optionContext === ue)
            switch (this.selectedIdx) {
              case this.optionIndex.BACK:
                this.previousContext();
                break;
              case this.optionIndex.EXPORT_DISK:
                this.app.exportGameDisk(), this.app.closeMenu();
                break;
              case this.optionIndex.IMPORT_DISK:
                this.resetInput(), this.app.importGameDisk();
                break;
              case this.optionIndex.CLEAR_DISK:
                this.app.clearGameDisk(), this.app.closeMenu();
            }
        }
        e & At && this.selectedIdx++, e & vt && this.selectedIdx--, this.selectedIdx = (this.selectedIdx + this.options.length) % this.options.length;
      }
      connectedCallback() {
        super.connectedCallback();
        const t = () => {
          this.netplaySummary = this.app.getNetplaySummary();
        };
        t(), this.netplayPollInterval = window.setInterval(t, 1000);
      }
      disconnectedCallback() {
        window.clearInterval(this.netplayPollInterval), super.disconnectedCallback();
      }
      render() {
        return j`<div class="version">WASM-4 v${"2.7.1"}</div><div class="menu"><ul style="display:${this.optionContext === de ? "inherit" : "none"}">${ae(fe[de], (t, e) => j`<li class="${this.selectedIdx == e ? "selected" : ""}" }>${t}</li>`)}</ul><ul style="display:${this.optionContext === ue ? "inherit" : "none"}">${ae(fe[ue], (t, e) => j`<li class="${this.selectedIdx == e ? "selected" : ""}" }>${t}</li>`)}</ul></div><div class="netplay-summary">${ae(this.netplaySummary, (t) => {
          const e = t.ping < 100 ? "good" : t.ping < 200 ? "ok" : "bad", s = t.ping < 0 ? j`<span class="ping-you">YOU</span>` : j`<span class="ping-${e}">${Math.ceil(t.ping)}ms</span>`;
          return j`<div>PLAYER ${t.playerIdx >= 0 ? t.playerIdx + 1 : "?"} ${s}</div>`;
        })}</div>`;
      }
    }, t.MenuOverlay.styles = a`:host{width:100vmin;height:100vmin;position:absolute;color:#a0a0a0;font:16px wasm4-font;display:flex;align-items:center;justify-content:center;flex-direction:column;background:rgba(0,0,0,.85)}.version{color:#fff;padding-bottom:1em}.menu{border:2px solid #f0f0f0;padding:0 1em 0 1em;line-height:2em}.netplay-summary{margin-top:2em;line-height:1.5em}.ping-you{color:#f0f0f0}.ping-good{color:green}.ping-ok{color:#ff0}.ping-bad{color:red}ul{list-style:none;padding-left:0;padding-right:1em}li::before{content:"\\00a0\\00a0"}li.selected::before{content:"> "}li.selected{color:#fff}`, ce([dt()], t.MenuOverlay.prototype, "selectedIdx", 2), ce([dt()], t.MenuOverlay.prototype, "netplaySummary", 2), t.MenuOverlay = ce([lt("wasm4-menu-overlay")], t.MenuOverlay);
    var { defineProperty: me, getOwnPropertyDescriptor: ye } = Object, we = (t, e, s, i) => {
      for (var n, r = i > 1 ? undefined : i ? ye(e, s) : e, o = t.length - 1;o >= 0; o--)
        (n = t[o]) && (r = (i ? n(e, s, r) : n(r)) || r);
      return i && r && me(e, s, r), r;
    };
    function ge(t, e, s) {
      t && (s ? t.classList.add(e) : t.classList.remove(e));
    }
    t.VirtualGamepad = class extends ot {
      constructor() {
        super(...arguments), this.touchEvents = new Map, this.onPointerEvent = (t) => {
          if (t.pointerType != "touch")
            return;
          switch (t.preventDefault(), t.type) {
            case "pointerdown":
            case "pointermove":
              this.touchEvents.set(t.pointerId, t);
              break;
            default:
              this.touchEvents.delete(t.pointerId);
          }
          let e = 0;
          if (this.touchEvents.size) {
            const t = 100, s = 10, i = 50, n = 0.6, r = this.dpad.getBoundingClientRect(), o = r.x + r.width / 2, a = r.y + r.height / 2, l = this.action1.getBoundingClientRect(), h = l.x + l.width / 2, c = l.y + l.height / 2, d = this.action2.getBoundingClientRect(), u = d.x + d.width / 2, p = d.y + d.height / 2;
            let f, m, y, w, g;
            for (const b of this.touchEvents.values())
              f = b.clientX - o, m = b.clientY - a, y = Math.sqrt(f * f + m * m), y < t && y > s && (w = f / y, g = m / y, -w > n ? e |= gt : w > n && (e |= bt), -g > n ? e |= vt : g > n && (e |= At)), f = b.clientX - h, m = b.clientY - c, f * f + m * m < i * i && (e |= 1), f = b.clientX - u, m = b.clientY - p, f * f + m * m < i * i && (e |= 2);
          }
          ge(this.action1, "pressed", 1 & e), ge(this.action2, "pressed", 2 & e), ge(this.dpad, "pressed-left", e & gt), ge(this.dpad, "pressed-right", e & bt), ge(this.dpad, "pressed-up", e & vt), ge(this.dpad, "pressed-down", e & At), this.app.inputState.gamepad[0] = e;
        };
      }
      connectedCallback() {
        super.connectedCallback(), this.app.addEventListener("pointercancel", this.onPointerEvent), this.app.addEventListener("pointerdown", this.onPointerEvent), this.app.addEventListener("pointermove", this.onPointerEvent), this.app.addEventListener("pointerup", this.onPointerEvent);
      }
      disconnectedCallback() {
        this.app.removeEventListener("pointercancel", this.onPointerEvent), this.app.removeEventListener("pointerdown", this.onPointerEvent), this.app.removeEventListener("pointermove", this.onPointerEvent), this.app.removeEventListener("pointerup", this.onPointerEvent), super.disconnectedCallback();
      }
      onMenuButtonPressed(t) {
        this.app.onMenuButtonPressed(), t.stopImmediatePropagation();
      }
      render() {
        return j`<div class="menu" @pointerdown="${this.onMenuButtonPressed}"></div><div class="dpad"></div><div class="action1">X</div><div class="action2">Z</div>`;
      }
    }, t.VirtualGamepad.styles = a`:host{display:none}@media (hover:none) or (pointer:coarse){:host{display:inherit}}.dpad{pointer-events:none;position:absolute;width:39px;height:120px;left:69px;bottom:30px;background:#444;border-radius:9px}.dpad:before{position:absolute;width:120px;height:39px;top:39px;left:-39px;background:#444;border-radius:9px;content:""}.dpad:after{position:absolute;height:39px;width:39px;top:39px;border-radius:100%;background:#333;content:""}.dpad.pressed-left:before{border-left:4px solid #a93671;width:116px}.dpad.pressed-right:before{border-right:4px solid #a93671;width:116px}.dpad.pressed-up{border-top:4px solid #a93671}.dpad.pressed-down{border-bottom:4px solid #a93671;height:116px}.action1{right:80px;bottom:30px}.action2{right:30px;bottom:90px}.action1,.action2{pointer-events:none;position:absolute;width:60px;height:60px;border:4px solid #a93671;border-radius:50px;color:#a93671;font:24px wasm4-font;text-align:center;line-height:60px}.action1.pressed,.action2.pressed{background:#a93671}.menu{position:absolute;background:#444;width:60px;height:20px;bottom:200px;right:35px;border-radius:10px}`, we([pt(".dpad")], t.VirtualGamepad.prototype, "dpad", 2), we([pt(".action1")], t.VirtualGamepad.prototype, "action1", 2), we([pt(".action2")], t.VirtualGamepad.prototype, "action2", 2), t.VirtualGamepad = we([lt("wasm4-virtual-gamepad")], t.VirtualGamepad);
    var { defineProperty: be, getOwnPropertyDescriptor: ve } = Object, Ae = (t, e, s, i) => {
      for (var n, r = i > 1 ? undefined : i ? ve(e, s) : e, o = t.length - 1;o >= 0; o--)
        (n = t[o]) && (r = (i ? n(e, s, r) : n(r)) || r);
      return i && r && be(e, s, r), r;
    };
    return t.Notifications = class extends ot {
      constructor() {
        super(...arguments), this.notifications = [];
      }
      show(t) {
        this.notifications = this.notifications.concat([t]), setTimeout(() => {
          this.notifications = this.notifications.slice(1);
        }, 5000);
      }
      render() {
        return this.notifications.map((t) => j`<div class="notification">${t}</div>`);
      }
    }, t.Notifications.styles = a`:host{width:100vmin;height:100vmin;position:absolute;pointer-events:none;color:#fff;font:24px wasm4-font;display:flex;flex-direction:column}.notification{background:rgba(0,0,0,.85);padding:.5em;animation:appear .5s ease-out}@keyframes appear{from{padding-left:2em;opacity:0}to{opacity:1;padding-left:.5em}}`, Ae([dt()], t.Notifications.prototype, "notifications", 2), t.Notifications = Ae([lt("wasm4-notifications")], t.Notifications), Object.defineProperty(t, Symbol.toStringTag, { value: "Module" }), t;
  }({});
}

// src/api.ts
function verticalStackLayout(context) {
  const count = Math.max(1, context.panes.length);
  return { version: 1, rows: Array.from({ length: count }, () => ({ size: 1 / count })), columns: [{ size: 1 }], placements: context.panes.map((pane, row) => ({ paneId: pane.id, row, column: 0 })) };
}

// src/model.ts
function parseCart(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Invalid cart document");
  const c = value;
  const text = (key, max, optional = false) => optional && c[key] === undefined || typeof c[key] === "string" && [...c[key]].length <= max;
  if (Object.keys(c).some((k) => !["schemaVersion", "profile", "title", "build", "blobDigest", "size", "note", "controls"].includes(k)) || c.schemaVersion !== 1 || c.profile !== "w4" || !text("title", 128) || !text("note", 4000, true) || !text("controls", 1000, true) || !Number.isSafeInteger(c.build) || c.build < 1 || !Number.isInteger(c.size) || c.size < 1 || c.size > 65536 || typeof c.blobDigest !== "string" || !/^[a-f0-9]{64}$/.test(c.blobDigest))
    throw Error("Invalid cart document");
  return c;
}
function needsReload(digest, cart) {
  return digest !== cart.blobDigest;
}
async function verifyCart(input, cart) {
  if (input.length > 65536 || input.length !== cart.size)
    throw Error("Cart size mismatch or oversize");
  const bytes = new Uint8Array(input);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  const digest = Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
  if (digest !== cart.blobDigest)
    throw Error("Cart digest mismatch");
  if (!WebAssembly.validate(bytes))
    throw Error("Invalid WASM cartridge");
  return bytes;
}

// src/ui.ts
function arrange(context) {
  if (context.panes.length < 2)
    return verticalStackLayout(context);
  const selected = context.panes.find((p) => p.id === context.selectedPaneId) ?? context.panes[0];
  const others = context.panes.filter((p) => p !== selected);
  return { version: 1, rows: others.map(() => ({ size: 1 / others.length })), columns: [{ size: 2 / 3 }, { size: 1 / 3 }], placements: [{ paneId: selected.id, row: 0, column: 0, rowSpan: others.length }, ...others.map((p, row) => ({ paneId: p.id, row, column: 1 }))] };
}
function mount(container, context) {
  ensureRuntime();
  let disposed = false, visible = true, generation = 0, revision = -1, attemptedDigest = null, app = null, current = null, pending = null;
  const root = document.createElement("section");
  root.setAttribute("aria-label", "Stage");
  root.style.cssText = `background:${context.theme["--bg-surface"] ?? "#202020"};color:${context.theme["--text-primary"] ?? "#ffffff"};font-family:${context.theme["--font-mono"] ?? "monospace"};padding:12px`;
  const title = document.createElement("h2"), meta = document.createElement("p"), note = document.createElement("p"), controls = document.createElement("p"), status = document.createElement("p"), slot = document.createElement("div");
  status.setAttribute("role", "status");
  root.append(title, meta, note, controls, status, slot);
  container.append(root);
  const feedback = document.createElement("button");
  feedback.textContent = "Send feedback";
  const compose = () => {
    if (!disposed && !context.signal.aborted && current) {
      try {
        context.terminal?.compose(`stage build ${current.build}: `);
      } catch (error) {
        status.textContent = String(error);
      }
    }
  };
  if (context.terminal) {
    root.append(feedback);
    feedback.addEventListener("click", compose);
  }
  const stop = () => {
    pending?.abort();
    pending = null;
    app?.dispose();
    app?.remove();
    app = null;
  };
  const alive = (token) => !disposed && !context.signal.aborted && token === generation;
  const resize = new ResizeObserver(() => {
    if (!disposed && !context.signal.aborted)
      slot.style.setProperty("--cart-scale", String(Math.max(1, Math.floor(slot.clientWidth / 160))));
  });
  resize.observe(slot);
  const listener = async (value, rev) => {
    if (disposed || context.signal.aborted || rev < revision)
      return;
    revision = rev;
    let token = generation;
    try {
      if (value === null) {
        ++generation;
        stop();
        attemptedDigest = null;
        current = null;
        title.textContent = "No cart yet";
        status.textContent = 'ask the agent: "build me a WASM-4 game"';
        meta.textContent = note.textContent = controls.textContent = "";
        return;
      }
      let cart;
      try {
        cart = parseCart(value);
      } catch (error) {
        attemptedDigest = null;
        throw error;
      }
      current = cart;
      title.textContent = cart.title;
      meta.textContent = `Build ${cart.build} · revision ${rev}`;
      note.textContent = cart.note ?? "";
      controls.textContent = cart.controls ?? "";
      if (!needsReload(attemptedDigest, cart))
        return;
      token = ++generation;
      stop();
      attemptedDigest = cart.blobDigest;
      if (!context.blobs) {
        status.textContent = "This host is too old: Stage requires extension blobs.";
        return;
      }
      status.textContent = "Loading cart…";
      pending = new AbortController;
      const signal = AbortSignal.any([context.signal, pending.signal]);
      const fetched = await context.blobs.read(cart.blobDigest, signal);
      if (!alive(token))
        return;
      const bytes = await verifyCart(fetched, cart);
      if (!alive(token))
        return;
      const next = document.createElement("wasm4-app");
      next.tabIndex = 0;
      next.setAttribute("aria-label", "Game: arrow keys, X and Z");
      app = next;
      next.setVisible(visible);
      slot.append(next);
      await next.startCart(bytes, `${context.scope.installationId}:${context.scope.sessionId}:${current.title}`);
      if (!alive(token)) {
        next.dispose();
        return;
      }
      pending = null;
      status.textContent = "Running";
    } catch (error) {
      if (alive(token)) {
        ++generation;
        stop();
        status.textContent = `Stage error: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
  };
  listener(null, 0);
  const unsubscribe = context.documents.subscribe("cart", (value, rev) => {
    listener(value, rev);
  });
  const dispose = () => {
    if (disposed)
      return;
    disposed = true;
    ++generation;
    stop();
    unsubscribe();
    resize.disconnect();
    feedback.removeEventListener("click", compose);
    context.signal.removeEventListener("abort", dispose);
    root.remove();
  };
  context.signal.addEventListener("abort", dispose, { once: true });
  if (context.signal.aborted)
    dispose();
  return { dispose, setVisible(nextVisible) {
    if (disposed || context.signal.aborted)
      return;
    visible = nextVisible;
    root.hidden = !visible;
    app?.setVisible(visible);
  } };
}
function register(host) {
  host.registerContextView({ id: "stage", title: "Stage", mount });
  host.registerTerminalLayout({ id: "stage-side", title: "Stage beside terminal", arrange });
}
export {
  register as default
};
