const mod = require('../../');
const { Branch } = mod;

describe('the tree is build correctly', () => {
  let instance;
  beforeEach(() => {
    instance = new Branch();
  });

  it('for leaf regexp', () => {
    instance.add('/{param}/path', 'GET', () => {});
    expect(instance.tree).toMatchSnapshot();
  });

  it('for leaf string', () => {
    instance.add('/simplestring/path', 'GET', () => {});
    expect(instance.tree).toMatchSnapshot();
  });
});

describe('lookup returns correctly', () => {
  let instance;

  const pathA = '/handler/stringa';
  const pathAbad = '/nohandler/stringa';
  const pathAtrailingSlash = '/handler/stringa/';
  const pathB = '/handler/basdf';
  const pathC = '/handler/casdfasdf/stringc';
  const pathD = '/handler/cacacaccc/stringd';
  const pathE = '/handler/get/params?bob=sue&cat=alfie';
  const pathF = '/handler/dasdfasdfpartfffffffsextra/get';

  const expectedParamsD = {
    url: {
      paramc: 'acacaccc'
    },
    get: {}
  };

  const expectedParamsE = {
    get: {
      bob: 'sue',
      cat: 'alfie'
    },
    url: {}
  };

  const expectedParamsF = {
    url: {
      paramA: 'asdfasdf',
      paramB: 'fffffffs'
    },
    get: {}
  };

  const handlerA = () => {};
  const handlerB = () => {};
  const handlerC = () => {};
  const handlerD = () => {};
  const handlerE = () => {};
  const handlerF = () => {};

  const addTestMethods = (instance) => {
    instance.add(pathA, 'GET', handlerA);
    instance.add('/handler/b{paramb}', 'GET', handlerB);
    instance.add('/handler/c{paramc}/stringc', 'GET', handlerC);
    instance.add('/handler/c{paramc}/stringd/', 'ANY', handlerD);
    instance.add('/handler/get/params', 'ANY', handlerE);
    instance.add('/handler/d{paramA}part{paramB}extra/get', 'GET', handlerF);
    return instance;
  };

  beforeEach(() => {
    instance = new Branch();
    instance = addTestMethods(instance);
  });

  it('for simple string lookups that don\'t match', () => {
    const lookupResult = instance.lookup(pathAbad, 'GET');
    expect(lookupResult).toMatchSnapshot();
    expect(lookupResult.foundRoute).toBe(false);
    expect(lookupResult.handler).toEqual(undefined);
  });

  it('for simple string lookups', () => {
    const lookupResult = instance.lookup(pathA, 'GET');
    expect(lookupResult).toMatchSnapshot();
    expect(lookupResult.foundRoute).toBe(true);
    expect(lookupResult.handler).toEqual(handlerA);
  });

  it('for simple string lookups removing the trailing slash', () => {
    const lookupResult = instance.lookup(pathAtrailingSlash, 'GET');
    expect(lookupResult).toMatchSnapshot();
    expect(lookupResult.foundRoute).toBe(true);
    expect(lookupResult.handler).toEqual(handlerA);
  });

  it('for mixed regexp and string lookups', () => {
    const lookupResult = instance.lookup(pathB, 'GET');
    expect(lookupResult).toMatchSnapshot();
    expect(lookupResult.foundRoute).toBe(true);
    expect(lookupResult.handler).toEqual(handlerB);
  });

  it('not found when leaf doesn\'t exist', () => {
    const lookupResult = instance.lookup(pathC, 'GET');
    expect(lookupResult).toMatchSnapshot();
    expect(lookupResult.foundRoute).toBe(true);
    expect(lookupResult.handler).toEqual(handlerC);
  });

  it('handles different methods falling back to ANY', () => {
    const lookupResult = instance.lookup(pathD, 'BOB');
    expect(lookupResult).toMatchSnapshot();
    expect(lookupResult.foundRoute).toBe(true);
    expect(lookupResult.handler).toEqual(handlerD);
    expect(lookupResult.params).toEqual(expectedParamsD);
  });

  it('handles different methods falling back to ANY', () => {
    const lookupResult = instance.lookup(pathE, 'GET');
    expect(lookupResult).toMatchSnapshot();
    expect(lookupResult.foundRoute).toBe(true);
    expect(lookupResult.handler).toEqual(handlerE);
    expect(lookupResult.params).toEqual(expectedParamsE);
  });

  it('handles regexp extra bits on params', () => {
    const lookupResult = instance.lookup(pathF, 'GET');
    expect(lookupResult).toMatchSnapshot();
    expect(lookupResult.foundRoute).toBe(true);
    expect(lookupResult.handler).toEqual(handlerF);
    expect(lookupResult.params).toEqual(expectedParamsF);
  });
});
