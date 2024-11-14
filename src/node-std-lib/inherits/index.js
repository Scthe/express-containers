export default inherits;

function inherits(ctor, superCtor) {
  if (superCtor) {
    /*
    if (!ctor) {
      throw new Error('Child class not probided to inherits()');
    }
    if (!superCtor) {
      throw new Error(
        'Super class not probided to inherits() for ' + ctor.name
      );
    }
    // console.log('Inherits', ctor.name, 'extends', superCtor.name);
    */
    ctor.super_ = superCtor;
    var TempCtor = function () {};
    TempCtor.prototype = superCtor.prototype;
    ctor.prototype = new TempCtor();
    ctor.prototype.constructor = ctor;
  }
}
