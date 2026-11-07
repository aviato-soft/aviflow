import { expect, jest, test } from '@jest/globals';
import AviFlow from '../src/AviFlow.js';
import { AviFlowActions } from '../src/AviFlowActions.js';

describe('AviFlow / resolveAction', () => {

  const create = (actions = {}) => new AviFlow(actions, { autoInit: false });


  // ---------------------------------------------------------------------------
  // Invalid input
  // ---------------------------------------------------------------------------
  describe('invalid input', () => {

    test('should return null when flow.action is missing', () => {
      const flow = create({ save: jest.fn() });

      flow.action = null;
      expect(flow.resolveAction('save')).toBeNull();

      flow.action = undefined;
      expect(flow.resolveAction('save')).toBeNull();
    });


    test('should return null when path is not a string', () => {
      const flow = create({ save: jest.fn() });

      expect(flow.resolveAction()).toBeNull();
      expect(flow.resolveAction(undefined)).toBeNull();
      expect(flow.resolveAction(null)).toBeNull();
      expect(flow.resolveAction(123)).toBeNull();
      expect(flow.resolveAction(true)).toBeNull();
      expect(flow.resolveAction({})).toBeNull();
      expect(flow.resolveAction(['save'])).toBeNull();
      expect(flow.resolveAction(() => { })).toBeNull();
    });


    test('should return null for an empty string', () => {
      const flow = create({ save: jest.fn() });

      expect(flow.resolveAction('')).toBeNull();
    });

  });


  // ---------------------------------------------------------------------------
  // Top-level (flat) actions
  // ---------------------------------------------------------------------------
  describe('top-level actions', () => {

    test('should resolve a top-level function and return flow.action as owner', () => {
      const save = jest.fn();
      const flow = create({ save });

      const result = flow.resolveAction('save');

      expect(result).toEqual({ fn: save, owner: flow.action });
      expect(result.fn).toBe(save);
      expect(result.owner).toBe(flow.action);
    });


    test('should resolve the default "fetch" action', () => {
      const flow = create();

      const result = flow.resolveAction('fetch');

      expect(result.fn).toBe(AviFlowActions.fetchData);
      expect(result.owner).toBe(flow.action);
    });


    test('should let user actions override the default "fetch" action', () => {
      const customFetch = jest.fn();
      const flow = create({ fetch: customFetch });

      expect(flow.resolveAction('fetch').fn).toBe(customFetch);
    });


    test('should resolve actions assigned after construction', () => {
      const flow = create();
      const reload = jest.fn();

      expect(flow.resolveAction('reload')).toBeNull();

      flow.action.reload = reload;

      expect(flow.resolveAction('reload')).toEqual({ fn: reload, owner: flow.action });
    });


    test('should resolve actions after flow.action is replaced entirely', () => {
      const flow = create({ save: jest.fn() });
      const other = jest.fn();

      flow.action = { other };

      expect(flow.resolveAction('save')).toBeNull();
      expect(flow.resolveAction('other')).toEqual({ fn: other, owner: flow.action });
    });


    test('should return null for an unknown action', () => {
      const flow = create({ save: jest.fn() });

      expect(flow.resolveAction('unknown')).toBeNull();
    });


    test('should return null when a top-level key is not a function', () => {
      const flow = create({
        str: 'text',
        num: 42,
        obj: { a: 1 },
        nul: null,
        undef: undefined,
        bool: true
      });

      expect(flow.resolveAction('str')).toBeNull();
      expect(flow.resolveAction('num')).toBeNull();
      expect(flow.resolveAction('obj')).toBeNull();
      expect(flow.resolveAction('nul')).toBeNull();
      expect(flow.resolveAction('undef')).toBeNull();
      expect(flow.resolveAction('bool')).toBeNull();
    });


    test('should be case sensitive', () => {
      const flow = create({ saveData: jest.fn() });

      expect(flow.resolveAction('savedata')).toBeNull();
      expect(flow.resolveAction('SaveData')).toBeNull();
      expect(flow.resolveAction('saveData')).not.toBeNull();
    });

  });


  // ---------------------------------------------------------------------------
  // Exact keys containing dots
  // ---------------------------------------------------------------------------
  describe('exact keys containing dots', () => {

    test('should resolve a flat key that contains dots', () => {
      const dotted = jest.fn();
      const flow = create({ 'admin.users.remove': dotted });

      const result = flow.resolveAction('admin.users.remove');

      expect(result.fn).toBe(dotted);
      expect(result.owner).toBe(flow.action);
    });


    test('should prefer the exact dotted key over path resolution', () => {
      const exact = jest.fn();
      const nested = jest.fn();
      const flow = create({
        'admin.remove': exact,
        admin: { remove: nested }
      });

      const result = flow.resolveAction('admin.remove');

      expect(result.fn).toBe(exact);
      expect(result.owner).toBe(flow.action);
    });


    test('should return null (and not fall back to path resolution) when the exact key is not a function', () => {
      const nested = jest.fn();
      const flow = create({
        'admin.remove': 'not a function',
        admin: { remove: nested }
      });

      expect(flow.resolveAction('admin.remove')).toBeNull();
    });


    test('should still resolve nested path when no exact key matches', () => {
      const nested = jest.fn();
      const flow = create({ admin: { remove: nested } });

      expect(flow.resolveAction('admin.remove').fn).toBe(nested);
    });

  });


  // ---------------------------------------------------------------------------
  // Nested path resolution
  // ---------------------------------------------------------------------------
  describe('nested paths', () => {

    test('should resolve a one level path and return the nested object as owner', () => {
      const id = jest.fn();
      const getTrigger = { id };
      const flow = create({ getTrigger });

      const result = flow.resolveAction('getTrigger.id');

      expect(result.fn).toBe(id);
      expect(result.owner).toBe(getTrigger);
      expect(result.owner).not.toBe(flow.action);
    });


    test('should resolve a path of any depth and return the immediate parent as owner', () => {
      const remove = jest.fn();
      const users = { remove };
      const admin = { users };
      const flow = create({ admin });

      const result = flow.resolveAction('admin.users.remove');

      expect(result.fn).toBe(remove);
      expect(result.owner).toBe(users);

      const deep = jest.fn();
      const flow2 = create({ a: { b: { c: { d: { e: deep } } } } });
      expect(flow2.resolveAction('a.b.c.d.e').fn).toBe(deep);
      expect(flow2.resolveAction('a.b.c.d.e').owner).toBe(flow2.action.a.b.c.d);
    });


    test('should allow calling the resolved function with the owner as "this"', () => {
      const store = {
        value: 'owner-value',
        read() { return this.value; }
      };
      const flow = create({ store });

      const { fn, owner } = flow.resolveAction('store.read');

      expect(fn.call(owner)).toBe('owner-value');
    });


    test('should resolve methods of a class instance (inherited from a non Object.prototype)', () => {
      class Service {
        run() { return 'ran'; }
      }
      const service = new Service();
      const flow = create({ service });

      const result = flow.resolveAction('service.run');

      expect(result.fn).toBe(Service.prototype.run);
      expect(result.owner).toBe(service);
      expect(result.fn.call(result.owner)).toBe('ran');
    });


    test('should traverse arrays since they are objects', () => {
      const first = jest.fn();
      const list = [first];
      const flow = create({ list });

      const result = flow.resolveAction('list.0');

      expect(result.fn).toBe(first);
      expect(result.owner).toBe(list);
    });


    test('should return null when an intermediate segment does not exist', () => {
      const flow = create({ admin: { users: { remove: jest.fn() } } });

      expect(flow.resolveAction('missing.users.remove')).toBeNull();
      expect(flow.resolveAction('admin.missing.remove')).toBeNull();
      expect(flow.resolveAction('admin.users.missing')).toBeNull();
    });


    test('should return null when an intermediate segment is null', () => {
      const flow = create({ admin: null, other: { users: null } });

      expect(flow.resolveAction('admin.users')).toBeNull();
      expect(flow.resolveAction('other.users.remove')).toBeNull();
    });


    test('should return null when an intermediate segment is undefined', () => {
      const flow = create({ admin: { users: undefined } });

      expect(flow.resolveAction('admin.users.remove')).toBeNull();
    });


    test('should return null when traversing through a primitive', () => {
      const flow = create({ str: 'text', num: 5, bool: true });

      expect(flow.resolveAction('str.length')).toBeNull();
      expect(flow.resolveAction('str.toUpperCase')).toBeNull();
      expect(flow.resolveAction('num.toFixed')).toBeNull();
      expect(flow.resolveAction('bool.valueOf')).toBeNull();
    });


    test('should never traverse through functions', () => {
      const parent = jest.fn();
      parent.child = jest.fn();
      const flow = create({ parent });

      expect(flow.resolveAction('parent')).not.toBeNull();
      expect(flow.resolveAction('parent.child')).toBeNull();
      expect(flow.resolveAction('parent.call')).toBeNull();
      expect(flow.resolveAction('parent.bind')).toBeNull();
    });


    test('should return null when the final node is not a function', () => {
      const flow = create({
        admin: { name: 'root', users: { remove: jest.fn() }, count: 3, nothing: null }
      });

      expect(flow.resolveAction('admin')).toBeNull();
      expect(flow.resolveAction('admin.users')).toBeNull();
      expect(flow.resolveAction('admin.name')).toBeNull();
      expect(flow.resolveAction('admin.count')).toBeNull();
      expect(flow.resolveAction('admin.nothing')).toBeNull();
    });

  });


  // ---------------------------------------------------------------------------
  // Malformed paths
  // ---------------------------------------------------------------------------
  describe('malformed paths', () => {

    test('should return null for empty segments', () => {
      const flow = create({ admin: { remove: jest.fn() } });

      expect(flow.resolveAction('.')).toBeNull();
      expect(flow.resolveAction('.admin')).toBeNull();
      expect(flow.resolveAction('admin.')).toBeNull();
      expect(flow.resolveAction('admin..remove')).toBeNull();
      expect(flow.resolveAction('..')).toBeNull();
    });


    test('should not trim whitespace in segments', () => {
      const flow = create({ admin: { remove: jest.fn() } });

      expect(flow.resolveAction(' admin.remove')).toBeNull();
      expect(flow.resolveAction('admin .remove')).toBeNull();
      expect(flow.resolveAction('admin. remove')).toBeNull();
    });

  });


  // ---------------------------------------------------------------------------
  // Security: unsafe keys and inherited members
  // ---------------------------------------------------------------------------
  describe('security', () => {

    test.each(['__proto__', 'prototype', 'constructor'])(
      'should reject unsafe key "%s" at the top level',
      (key) => {
        const flow = create({ ok: jest.fn() });

        expect(flow.resolveAction(key)).toBeNull();
      }
    );


    test.each(['__proto__', 'prototype', 'constructor'])(
      'should reject unsafe key "%s" in the middle of a path',
      (key) => {
        const flow = create({ admin: { remove: jest.fn() } });

        expect(flow.resolveAction(`admin.${key}.remove`)).toBeNull();
        expect(flow.resolveAction(`${key}.admin.remove`)).toBeNull();
      }
    );


    test.each(['__proto__', 'prototype', 'constructor'])(
      'should reject unsafe key "%s" at the end of a path',
      (key) => {
        const flow = create({ admin: { remove: jest.fn() } });

        expect(flow.resolveAction(`admin.${key}`)).toBeNull();
      }
    );


    test('should reject unsafe keys even when they are own properties', () => {
      const evil = jest.fn();
      const nested = {};
      Object.defineProperty(nested, 'constructor', { value: evil, enumerable: true });
      Object.defineProperty(nested, 'prototype', { value: evil, enumerable: true });
      const flow = create({ admin: nested });

      expect(flow.resolveAction('admin.constructor')).toBeNull();
      expect(flow.resolveAction('admin.prototype')).toBeNull();
    });


    test('should not resolve "constructor" to Function or Object constructors', () => {
      const flow = create({ admin: { remove: jest.fn() } });

      expect(flow.resolveAction('constructor')).toBeNull();
      expect(flow.resolveAction('admin.constructor')).toBeNull();
      expect(flow.resolveAction('admin.remove.constructor')).toBeNull();
      expect(flow.resolveAction('admin.constructor.constructor')).toBeNull();
    });


    test.each([
      'toString',
      'valueOf',
      'hasOwnProperty',
      'isPrototypeOf',
      'propertyIsEnumerable',
      'toLocaleString'
    ])('should reject inherited Object.prototype member "%s"', (key) => {
      const flow = create({ admin: { remove: jest.fn() } });

      // top level
      expect(flow.resolveAction(key)).toBeNull();
      // nested
      expect(flow.resolveAction(`admin.${key}`)).toBeNull();
    });


    test('should allow an own property that shadows an Object.prototype member', () => {
      const toString = jest.fn();
      const flow = create({ admin: { toString } });

      const result = flow.resolveAction('admin.toString');

      expect(result.fn).toBe(toString);
      expect(result.owner).toBe(flow.action.admin);
    });


    test('should allow a top-level own action named like an Object.prototype member', () => {
      const valueOf = jest.fn();
      const flow = create({ valueOf });

      const result = flow.resolveAction('valueOf');

      expect(result.fn).toBe(valueOf);
      expect(result.owner).toBe(flow.action);
    });


    test('should not pollute Object.prototype or expose it through the resolved result', () => {
      const flow = create({ admin: { remove: jest.fn() } });

      flow.resolveAction('__proto__.polluted');
      flow.resolveAction('admin.__proto__.polluted');
      flow.resolveAction('constructor.prototype.polluted');

      expect({}.polluted).toBeUndefined();
      expect(Object.prototype.polluted).toBeUndefined();
    });


    test('should resolve actions on objects created with a null prototype', () => {
      const remove = jest.fn();
      const nested = Object.create(null);
      nested.remove = remove;
      const flow = create({ admin: nested });

      const result = flow.resolveAction('admin.remove');

      expect(result.fn).toBe(remove);
      expect(result.owner).toBe(nested);
      expect(flow.resolveAction('admin.toString')).toBeNull();
    });

  });

});
