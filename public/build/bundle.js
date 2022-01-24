
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.2' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/App.svelte generated by Svelte v3.46.2 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let form0;
    	let label0;
    	let t2;
    	let b0;
    	let t4;
    	let input0;
    	let t5;
    	let button0;
    	let t7;
    	let form1;
    	let label1;
    	let t8;
    	let b1;
    	let t10;
    	let input1;
    	let t11;
    	let button1;
    	let t13;
    	let form2;
    	let label2;
    	let t14;
    	let b2;
    	let t16;
    	let input2;
    	let t17;
    	let button2;
    	let t19;
    	let h2;
    	let t20;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "📑 DigiTrivia";
    			t1 = space();
    			form0 = element("form");
    			label0 = element("label");
    			t2 = text("Type a ");
    			b0 = element("b");
    			b0.textContent = "Num";
    			t4 = space();
    			input0 = element("input");
    			t5 = space();
    			button0 = element("button");
    			button0.textContent = "🔎 Show Trivia";
    			t7 = space();
    			form1 = element("form");
    			label1 = element("label");
    			t8 = text("Type a ");
    			b1 = element("b");
    			b1.textContent = "Year";
    			t10 = space();
    			input1 = element("input");
    			t11 = space();
    			button1 = element("button");
    			button1.textContent = "🔎 Show Trivia";
    			t13 = space();
    			form2 = element("form");
    			label2 = element("label");
    			t14 = text("Type a ");
    			b2 = element("b");
    			b2.textContent = "Date";
    			t16 = space();
    			input2 = element("input");
    			t17 = space();
    			button2 = element("button");
    			button2.textContent = "🔎 Show Trivia";
    			t19 = space();
    			h2 = element("h2");
    			t20 = text(/*trivia*/ ctx[3]);
    			attr_dev(h1, "class", "svelte-1u5rshg");
    			add_location(h1, file, 47, 2, 1024);
    			add_location(b0, file, 49, 31, 1144);
    			attr_dev(label0, "for", "number");
    			attr_dev(label0, "class", "svelte-1u5rshg");
    			add_location(label0, file, 49, 4, 1117);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "name", "number");
    			attr_dev(input0, "class", "svelte-1u5rshg");
    			add_location(input0, file, 50, 4, 1167);
    			add_location(button0, file, 51, 4, 1229);
    			attr_dev(form0, "class", "svelte-1u5rshg");
    			add_location(form0, file, 48, 2, 1049);
    			add_location(b1, file, 54, 29, 1364);
    			attr_dev(label1, "for", "year");
    			attr_dev(label1, "class", "svelte-1u5rshg");
    			add_location(label1, file, 54, 4, 1339);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "name", "year");
    			attr_dev(input1, "class", "svelte-1u5rshg");
    			add_location(input1, file, 55, 4, 1388);
    			add_location(button1, file, 56, 4, 1446);
    			attr_dev(form1, "class", "svelte-1u5rshg");
    			add_location(form1, file, 53, 2, 1273);
    			add_location(b2, file, 59, 29, 1581);
    			attr_dev(label2, "for", "date");
    			attr_dev(label2, "class", "svelte-1u5rshg");
    			add_location(label2, file, 59, 4, 1556);
    			attr_dev(input2, "type", "date");
    			attr_dev(input2, "name", "date");
    			attr_dev(input2, "class", "svelte-1u5rshg");
    			add_location(input2, file, 60, 4, 1605);
    			add_location(button2, file, 61, 4, 1661);
    			attr_dev(form2, "class", "svelte-1u5rshg");
    			add_location(form2, file, 58, 2, 1490);
    			attr_dev(h2, "class", "svelte-1u5rshg");
    			add_location(h2, file, 63, 2, 1705);
    			attr_dev(main, "class", "svelte-1u5rshg");
    			add_location(main, file, 46, 0, 1015);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, form0);
    			append_dev(form0, label0);
    			append_dev(label0, t2);
    			append_dev(label0, b0);
    			append_dev(form0, t4);
    			append_dev(form0, input0);
    			set_input_value(input0, /*number*/ ctx[0]);
    			append_dev(form0, t5);
    			append_dev(form0, button0);
    			append_dev(main, t7);
    			append_dev(main, form1);
    			append_dev(form1, label1);
    			append_dev(label1, t8);
    			append_dev(label1, b1);
    			append_dev(form1, t10);
    			append_dev(form1, input1);
    			set_input_value(input1, /*year*/ ctx[1]);
    			append_dev(form1, t11);
    			append_dev(form1, button1);
    			append_dev(main, t13);
    			append_dev(main, form2);
    			append_dev(form2, label2);
    			append_dev(label2, t14);
    			append_dev(label2, b2);
    			append_dev(form2, t16);
    			append_dev(form2, input2);
    			set_input_value(input2, /*date*/ ctx[2]);
    			append_dev(form2, t17);
    			append_dev(form2, button2);
    			append_dev(main, t19);
    			append_dev(main, h2);
    			append_dev(h2, t20);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[8]),
    					listen_dev(form0, "submit", prevent_default(/*submit_handler*/ ctx[9]), false, true, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[10]),
    					listen_dev(form1, "submit", prevent_default(/*submit_handler_1*/ ctx[11]), false, true, false),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[12]),
    					listen_dev(form2, "submit", prevent_default(/*submit_handler_2*/ ctx[13]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*number*/ 1 && to_number(input0.value) !== /*number*/ ctx[0]) {
    				set_input_value(input0, /*number*/ ctx[0]);
    			}

    			if (dirty & /*year*/ 2 && to_number(input1.value) !== /*year*/ ctx[1]) {
    				set_input_value(input1, /*year*/ ctx[1]);
    			}

    			if (dirty & /*date*/ 4) {
    				set_input_value(input2, /*date*/ ctx[2]);
    			}

    			if (dirty & /*trivia*/ 8) set_data_dev(t20, /*trivia*/ ctx[3]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let month;
    	let day;
    	let api;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let proxy = "https://thingproxy.freeboard.io/fetch";
    	let url = `${proxy}/http://numbersapi.com`;
    	let number = Math.trunc(Math.random() * 100) + 1;
    	let year = new Date().getFullYear();
    	let trivia = "🙄 Pick a number";
    	let date = new Date();

    	let getEmoji = () => {
    		let emojis = ["🤓", "🤯", "💬", "👌", "🧠", "👀", "🗯️", "📈", "🎉", "📖", "💡"];
    		let x = Math.floor(Math.random() * emojis.length / 2);
    		return emojis[x];
    	};

    	let fetchTrivia = async uri => {
    		try {
    			let response = await fetch(uri);
    			let result = await response.json();
    			$$invalidate(3, trivia = `${getEmoji()} ${result.text}`);
    		} catch(error) {
    			console.log(error);
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		number = to_number(this.value);
    		$$invalidate(0, number);
    	}

    	const submit_handler = () => fetchTrivia(api.number);

    	function input1_input_handler() {
    		year = to_number(this.value);
    		$$invalidate(1, year);
    	}

    	const submit_handler_1 = () => fetchTrivia(api.year);

    	function input2_input_handler() {
    		date = this.value;
    		$$invalidate(2, date);
    	}

    	const submit_handler_2 = () => fetchTrivia(api.date);

    	$$self.$capture_state = () => ({
    		proxy,
    		url,
    		number,
    		year,
    		trivia,
    		date,
    		getEmoji,
    		fetchTrivia,
    		day,
    		month,
    		api
    	});

    	$$self.$inject_state = $$props => {
    		if ('proxy' in $$props) proxy = $$props.proxy;
    		if ('url' in $$props) $$invalidate(15, url = $$props.url);
    		if ('number' in $$props) $$invalidate(0, number = $$props.number);
    		if ('year' in $$props) $$invalidate(1, year = $$props.year);
    		if ('trivia' in $$props) $$invalidate(3, trivia = $$props.trivia);
    		if ('date' in $$props) $$invalidate(2, date = $$props.date);
    		if ('getEmoji' in $$props) getEmoji = $$props.getEmoji;
    		if ('fetchTrivia' in $$props) $$invalidate(5, fetchTrivia = $$props.fetchTrivia);
    		if ('day' in $$props) $$invalidate(6, day = $$props.day);
    		if ('month' in $$props) $$invalidate(7, month = $$props.month);
    		if ('api' in $$props) $$invalidate(4, api = $$props.api);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*date*/ 4) {
    			$$invalidate(7, month = new Date(date).getUTCMonth() + 1);
    		}

    		if ($$self.$$.dirty & /*date*/ 4) {
    			$$invalidate(6, day = new Date(date).getUTCDate());
    		}

    		if ($$self.$$.dirty & /*number, year, month, day*/ 195) {
    			$$invalidate(4, api = {
    				number: `${url}/${number}/trivia?json`,
    				year: `${url}/${year}/year?json`,
    				date: `${url}/${month}/${day}/date?json`
    			});
    		}
    	};

    	return [
    		number,
    		year,
    		date,
    		trivia,
    		api,
    		fetchTrivia,
    		day,
    		month,
    		input0_input_handler,
    		submit_handler,
    		input1_input_handler,
    		submit_handler_1,
    		input2_input_handler,
    		submit_handler_2
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
      props: {},
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
