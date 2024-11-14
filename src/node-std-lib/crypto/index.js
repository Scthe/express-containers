export const createHash = (hashType) => new HashMock(hashType);

class HashMock {
  constructor(hashType) {
    this.hashType = hashType;
  }
  update = () => this;
  digest = () => String(Math.random()); // bwahahahahahahahah
}
