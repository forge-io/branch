const mod = require('../');
const { Branch } = mod;

describe('the Branch class', () => {
  let instance;
  beforeEach(() => {
    instance = new Branch();
  });


  it('has a add method', () => {
    expect(typeof instance.add).toBe('function');
  });
  it('has a lookup method', () => {
    expect(typeof instance.lookup).toBe('function');
  });
});
