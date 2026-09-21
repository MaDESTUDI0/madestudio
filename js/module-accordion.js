/**
 * Animates the .module <details>/<summary> blocks on cabinet.html —
 * native <details> just snaps open/closed with no way to transition
 * across display:none, so this intercepts the toggle and animates
 * max-height on .module-body instead, syncing the [open] attribute
 * at the right moment for the +/- indicator and a11y state.
 */
(function(){
  var DURATION = 400;

  document.querySelectorAll('.module').forEach(function(details){
    var summary = details.querySelector(':scope > summary');
    var body = details.querySelector(':scope > .module-body');
    if (!summary || !body) return;

    body.style.overflow = 'hidden';
    body.style.transition = 'max-height ' + DURATION + 'ms cubic-bezier(.16,1,.3,1)';
    body.style.maxHeight = details.hasAttribute('open') ? 'none' : '0px';

    var animating = false;

    summary.addEventListener('click', function(e){
      e.preventDefault();
      if (animating) return;
      animating = true;

      var isOpen = details.hasAttribute('open');

      if (isOpen) {
        body.style.maxHeight = body.scrollHeight + 'px';
        requestAnimationFrame(function(){
          requestAnimationFrame(function(){
            body.style.maxHeight = '0px';
          });
        });
        setTimeout(function(){
          details.removeAttribute('open');
          animating = false;
        }, DURATION);
      } else {
        details.setAttribute('open', '');
        var target = body.scrollHeight;
        body.style.maxHeight = '0px';
        requestAnimationFrame(function(){
          requestAnimationFrame(function(){
            body.style.maxHeight = target + 'px';
          });
        });
        setTimeout(function(){
          body.style.maxHeight = 'none';
          animating = false;
        }, DURATION);
      }
    });
  });
})();
