/*!
 *  CanvasInput v1.2.7
 *  http://goldfirestudios.com/blog/108/CanvasInput-HTML5-Canvas-Text-Input
 *
 *  (c) 2013-2017, James Simpson of GoldFire Studios
 *  goldfirestudios.com
 *
 *  MIT License
 */

// create a buffer that stores all inputs so that tabbing
// between them is made possible.
var inputs = [];

// initialize the Canvas Input
export function CanvasInput(o) {
  var self = this;

  o = o ? o : {};

  // setup the defaults
  self._ctx = o.ctx;
  self._canvas = o.canvas;
  self._x = o.x || 0;
  self._y = o.y || 0;
  self._extraX = o.extraX || 0;
  self._extraY = o.extraY || 0;
  self._fontSize = o.fontSize || 14;
  self._fontFamily = o.fontFamily || 'Arial';
  self._fontColor = o.fontColor || '#000';
  self._placeHolderColor = o.placeHolderColor || '#bfbebd';
  self._fontWeight = o.fontWeight || 'normal';
  self._fontStyle = o.fontStyle || 'normal';
  self._readonly = o.readonly || false;
  self._maxlength = o.maxlength || null;
  self._width = o.width || 150;
  self._height = o.height || self._fontSize;
  self._padding = o.padding >= 0 ? o.padding : 5;
  self._borderWidth = o.borderWidth >= 0 ? o.borderWidth : 1;
  self._borderColor = o.borderColor || '#959595';
  self._borderRadius = o.borderRadius >= 0 ? o.borderRadius : 3;
  self._selectionColor = o.selectionColor || 'rgba(179, 212, 253, 0.8)';
  self._placeHolder = o.placeHolder || '';
  self._value = (o.value || self._placeHolder) + '';
  self._onsubmit = o.onsubmit || function() {};
  self._onkeydown = o.onkeydown || function() {};
  self._onkeyup = o.onkeyup || function() {};
  self._onfocus = o.onfocus || function() {};
  self._onblur = o.onblur || function() {};
  self._cursor = false;
  self._cursorPos = 0;
  self._hasFocus = false;
  self._selection = [0, 0];
  self._wasOver = false;

  // calculate the full width and height with padding, borders 
  self._calcWH();

  // setup the background color
  self._backgroundColor = o.backgroundColor || '#fff';

  // setup main canvas events
  if (self._canvas) {
    self.mouseMoveListener = function(e) {
      e = e || window.event;
      self.mousemove(e, self);
    };

    self._canvas.addEventListener('mousemove', self.mouseMoveListener, false);

    self.mouseDownListener = function(e) {
      e = e || window.event;
      self.mousedown(e, self);
    };

    self._canvas.addEventListener('mousedown', self.mouseDownListener, false);

    self.mouseUpListener = function(e) {
      e = e || window.event;
      self.mouseup(e, self);
    };

    self._canvas.addEventListener('mouseup', self.mouseUpListener, false);
  }

  // setup a global mouseup to blur the input outside of the canvas
  var autoBlur = function(e) {
    e = e || window.event;

    if (self._hasFocus && !self._mouseDown) {
      self.blur();
    }
  };
  window.addEventListener('mouseup', autoBlur, true);
  window.addEventListener('touchend', autoBlur, true);

  // create the hidden input element
  self._hiddenInput = document.createElement('input');
  self._hiddenInput.type = 'text';
  self._hiddenInput.style.position = 'absolute';
  self._hiddenInput.style.opacity = 0;
  self._hiddenInput.style.pointerEvents = 'none';
  self._hiddenInput.style.zIndex = 0;
  // hide native blue text cursor on iOS
  self._hiddenInput.style.transform = 'scale(0)';

  self._updateHiddenInput();
  if (self._maxlength) {
    self._hiddenInput.maxLength = self._maxlength;
  }
  document.body.appendChild(self._hiddenInput);
  self._hiddenInput.value = self._value;

  // setup the keydown listener
  self._hiddenInput.addEventListener('keydown', function(e) {
    e = e || window.event;

    if (self._hasFocus) {
      // hack to fix touch event bug in iOS Safari
      window.focus();
      self._hiddenInput.focus();

      // continue with the keydown event
      self.keydown(e, self);
    }
  });

  // setup the keyup listener
  self._hiddenInput.addEventListener('keyup', function(e) {
    e = e || window.event;

    // update the canvas input state information from the hidden input
    self._value = self._hiddenInput.value;
    self._cursorPos = self._hiddenInput.selectionStart;
    // update selection to hidden input's selection in case user did keyboard-based selection
    self._selection = [self._hiddenInput.selectionStart, self._hiddenInput.selectionEnd];
    self.render();

    if (self._hasFocus) {
      self._onkeyup(e, self);
    }
  });

  // add this to the buffer
  inputs.push(self);
  self._inputsIndex = inputs.length - 1;

  // draw the text box
  self.render();
};

// setup the prototype
CanvasInput.prototype = {
   /**
   * Get/set the x-position.
   * @param  {Number} data The pixel position along the x-coordinate.
   * @return {Mixed}      CanvasInput or current x-value.
   */
  x: function(data) {
    var self = this;

    if (typeof data !== 'undefined') {
      self._x = data;
      self._updateHiddenInput();

      return self.render();
    } else {
      return self._x;
    }
  },

  /**
   * Get/set the y-position.
   * @param  {Number} data The pixel position along the y-coordinate.
   * @return {Mixed}      CanvasInput or current y-value.
   */
  y: function(data) {
    var self = this;

    if (typeof data !== 'undefined') {
      self._y = data;
      self._updateHiddenInput();

      return self.render();
    } else {
      return self._y;
    }
  },

  /**
   * Get/set the extra x-position (generally used when no canvas is specified).
   * @param  {Number} data The pixel position along the x-coordinate.
   * @return {Mixed}      CanvasInput or current x-value.
   */
  extraX: function(data) {
    var self = this;

    if (typeof data !== 'undefined') {
      self._extraX = data;
      self._updateHiddenInput();

      return self.render();
    } else {
      return self._extraX;
    }
  },

  /**
   * Get/set the extra y-position (generally used when no canvas is specified).
   * @param  {Number} data The pixel position along the y-coordinate.
   * @return {Mixed}      CanvasInput or current y-value.
   */
  extraY: function(data) {
    var self = this;

    if (typeof data !== 'undefined') {
      self._extraY = data;
      self._updateHiddenInput();

      return self.render();
    } else {
      return self._extraY;
    }
  },

  /**
   * Get/set the font size.
   * @param  {Number} data Font size.
   * @return {Mixed}      CanvasInput or current font size.
   */
  fontSize: function(data) {
    var self = this;

    if (typeof data !== 'undefined') {
      self._fontSize = data;

      return self.render();
    } else {
      return self._fontSize;
    }
  },

  /**
   * Get/set the font family.
   * @param  {String} data Font family.
   * @return {Mixed}      CanvasInput or current font family.
   */
  fontFamily: function(data) {
    var self = this;

    if (typeof data !== 'undefined') {
      self._fontFamily = data;

      return self.render();
    } else {
      return self._fontFamily;
    }
  },

  /**
   * Get/set the font color.
   * @param  {String} data Font color.
   * @return {Mixed}      CanvasInput or current font color.
   */
  fontColor: function(data) {
    var self = this;

    if (typeof data !== 'undefined') {
      self._fontColor = data;

      return self.render();
    } else {
      return self._fontColor;
    }
  },

  /**
   * Get/set the place holder font color.
   * @param  {String} data Font color.
   * @return {Mixed}      CanvasInput or current place holder font color.
   */
  placeHolderColor: function(data) {
    var self = this;

    if (typeof data !== 'undefined') {
      self._placeHolderColor = data;

      return self.render();
    } else {
      return self._placeHolderColor;
    }
  },

  /**
   * Get/set the font weight.
   * @param  {String} data Font weight.
   * @return {Mixed}      CanvasInput or current font weight.
   */
  fontWeight: function(data) {
    var self = this;

    if (typeof data !== 'undefined') {
      self._fontWeight = data;

      return self.render();
    } else {
      return self._fontWeight;
    }
  },

  /**
   * Get/set the font style.
   * @param  {String} data Font style.
   * @return {Mixed}      CanvasInput or current font style.
   */
  fontStyle: function(data) {
    var self = this;

    if (typeof data !== 'undefined') {
      self._fontStyle = data;

      return self.render();
    } else {
      return self._fontStyle;
    }
  },

  /**
   * Get/set the width of the text box.
   * @param  {Number} data Width in pixels.
   * @return {Mixed}      CanvasInput or current width.
   */
  width: function(data) {
    var self = this;

    if (typeof data !== 'undefined') {
      self._width = data;
      self._calcWH();
      self._updateCanvasWH();
      self._updateHiddenInput();

      return self.render();
    } else {
      return self._width;
    }
  },

  /**
   * Get/set the height of the text box.
   * @param  {Number} data Height in pixels.
   * @return {Mixed}      CanvasInput or current height.
   */
  height: function(data) {
    var self = this;

    if (typeof data !== 'undefined') {
      self._height = data;
      self._calcWH();
      self._updateCanvasWH();
      self._updateHiddenInput();

      return self.render();
    } else {
      return self._height;
    }
  },

  /**
   * Get/set the padding of the text box.
   * @param  {Number} data Padding in pixels.
   * @return {Mixed}      CanvasInput or current padding.
   */
  padding: function(data) {
    var self = this;

    if (typeof data !== 'undefined') {
      self._padding = data;
      self._calcWH();
      self._updateCanvasWH();

      return self.render();
    } else {
      return self._padding;
    }
  },

  /**
   * Get/set the border width.
   * @param  {Number} data Border width.
   * @return {Mixed}      CanvasInput or current border width.
   */
  borderWidth: function(data) {
    var self = this;

    if (typeof data !== 'undefined') {
      self._borderWidth = data;
      self._calcWH();
      self._updateCanvasWH();

      return self.render();
    } else {
      return self._borderWidth;
    }
  },

  /**
   * Get/set the border color.
   * @param  {String} data Border color.
   * @return {Mixed}      CanvasInput or current border color.
   */
  borderColor: function(data) {
    var self = this;

    if (typeof data !== 'undefined') {
      self._borderColor = data;

      return self.render();
    } else {
      return self._borderColor;
    }
  },

  /**
   * Get/set the border radius.
   * @param  {Number} data Border radius.
   * @return {Mixed}      CanvasInput or current border radius.
   */
  borderRadius: function(data) {
    var self = this;

    if (typeof data !== 'undefined') {
      self._borderRadius = data;

      return self.render();
    } else {
      return self._borderRadius;
    }
  },

  /**
   * Get/set the background color.
   * @param  {Number} data Background color.
   * @return {Mixed}      CanvasInput or current background color.
   */
  backgroundColor: function(data) {
    var self = this;

    if (typeof data !== 'undefined') {
      self._backgroundColor = data;

      return self.render();
    } else {
      return self._backgroundColor;
    }
  },

  /**
   * Get/set the text selection color.
   * @param  {String} data Color.
   * @return {Mixed}      CanvasInput or current selection color.
   */
  selectionColor: function(data) {
    var self = this;

    if (typeof data !== 'undefined') {
      self._selectionColor = data;

      return self.render();
    } else {
      return self._selectionColor;
    }
  },

  /**
   * Get/set the place holder text.
   * @param  {String} data Place holder text.
   * @return {Mixed}      CanvasInput or current place holder text.
   */
  placeHolder: function(data) {
    var self = this;

    if (typeof data !== 'undefined') {
      self._placeHolder = data;

      return self.render();
    } else {
      return self._placeHolder;
    }
  },

  /**
   * Get/set the current text box value.
   * @param  {String} data Text value.
   * @return {Mixed}      CanvasInput or current text value.
   */
  value: function(data) {
    var self = this;

    if (typeof data !== 'undefined') {
      self._value = data + '';
      self._hiddenInput.value = data + '';

      // update the cursor position
      self._cursorPos = self._clipText().length;

      self.render();

      return self;
    } else {
      return (self._value === self._placeHolder) ? '' : self._value;
    }
  },

  /**
   * Set or fire the onsubmit event.
   * @param  {Function} fn Custom callback.
   */
  onsubmit: function(fn) {
    var self = this;

    if (typeof fn !== 'undefined') {
      self._onsubmit = fn;

      return self;
    } else {
      self._onsubmit();
    }
  },

  /**
   * Set or fire the onkeydown event.
   * @param  {Function} fn Custom callback.
   */
  onkeydown: function(fn) {
    var self = this;

    if (typeof fn !== 'undefined') {
      self._onkeydown = fn;

      return self;
    } else {
      self._onkeydown();
    }
  },

  /**
   * Set or fire the onkeyup event.
   * @param  {Function} fn Custom callback.
   */
  onkeyup: function(fn) {
    var self = this;

    if (typeof fn !== 'undefined') {
      self._onkeyup = fn;

      return self;
    } else {
      self._onkeyup();
    }
  },

  /**
   * Place focus on the CanvasInput box, placing the cursor
   * either at the end of the text or where the user clicked.
   * @param  {Number} pos (optional) The position to place the cursor.
   * @return {CanvasInput}
   */
  focus: function(pos) {
    var self = this;

    // only fire the focus event when going from unfocussed
    if (!self._hasFocus) {
      self._onfocus(self);

      // remove focus from all other inputs
      for (var i=0; i<inputs.length; i++) {
        if (inputs[i]._hasFocus) {
          inputs[i].blur();
        }
      }
    }

    // remove selection
    if (!self._selectionUpdated) {
      self._selection = [0, 0];
    } else {
      delete self._selectionUpdated;
    }

    // if this is readonly, don't allow it to get focus
    self._hasFocus = true;
    if (self._readonly) {
      self._hiddenInput.readOnly = true;
    } else {
      self._hiddenInput.readOnly = false;

      // update the cursor position
      self._cursorPos = (typeof pos === 'number') ? pos : self._clipText().length;

      // clear the place holder
      if (self._placeHolder === self._value) {
        self._value = '';
        self._hiddenInput.value = '';
      }

      self._cursor = true;

      // setup cursor interval
      if (self._cursorInterval) {
        clearInterval(self._cursorInterval);
      }
      self._cursorInterval = setInterval(function() {
        self._cursor = !self._cursor;
        self.render();
      }, 500);
    }

    // move the real focus to the hidden input
    var hasSelection = (self._selection[0] > 0 || self._selection[1] > 0);
    self._hiddenInput.focus();
    self._hiddenInput.selectionStart = hasSelection ? self._selection[0] : self._cursorPos;
    self._hiddenInput.selectionEnd = hasSelection ? self._selection[1] : self._cursorPos;

    return self.render();
  },

  /**
   * Removes focus from the CanvasInput box.
   * @param  {Object} _this Reference to this.
   * @return {CanvasInput}
   */
  blur: function(_this) {
    var self = _this || this;

    self._onblur(self);

    if (self._cursorInterval) {
      clearInterval(self._cursorInterval);
    }
    self._hasFocus = false;
    self._cursor = false;
    self._selection = [0, 0];
    self._hiddenInput.blur();

    // fill the place holder
    if (self._value === '') {
      self._value = self._placeHolder;
    }

    return self.render();
  },

  /**
   * Fired with the keydown event to draw the typed characters.
   * @param  {Event}       e    The keydown event.
   * @param  {CanvasInput} self
   * @return {CanvasInput}
   */
  keydown: function(e, self) {
    var keyCode = e.which,
      isShift = e.shiftKey,
      key = null,
      startText, endText;

    // make sure the correct text field is being updated
    if (self._readonly || !self._hasFocus) {
      return;
    }

    // fire custom user event
    self._onkeydown(e, self);

    // add support for Ctrl/Cmd+A selection
    if (keyCode === 65 && (e.ctrlKey || e.metaKey)) {
      self.selectText();
      e.preventDefault();
      return self.render();
    }

    // block keys that shouldn't be processed
    if (keyCode === 17 || e.metaKey || e.ctrlKey) {
      return self;
    }

    if (keyCode === 13) { // enter key
      e.preventDefault();
      self._onsubmit(e, self);
    } else if (keyCode === 9) { // tab key
      e.preventDefault();
      if (inputs.length > 1) {
        var next = (inputs[self._inputsIndex + 1]) ? self._inputsIndex + 1 : 0;
        self.blur();
        setTimeout(function() {
          inputs[next].focus();
        }, 10);
      }
    }

    // update the canvas input state information from the hidden input
    self._value = self._hiddenInput.value;
    self._cursorPos = self._hiddenInput.selectionStart;
    self._selection = [0, 0];

    return self.render();
  },

  /**
   * Fired with the click event on the canvas, and puts focus on/off
   * based on where the user clicks.
   * @param  {Event}       e    The click event.
   * @param  {CanvasInput} self
   * @return {CanvasInput}
   */
  click: function(e, self) {
    var mouse = self._mousePos(e),
      x = mouse.x,
      y = mouse.y;

    if (self._endSelection) {
      delete self._endSelection;
      delete self._selectionUpdated;
      return;
    }

    if (self._canvas && self._overInput(x, y) || !self._canvas) {
      if (self._mouseDown) {
        self._mouseDown = false;
        self.click(e, self);
        return self.focus(self._clickPos(x, y));
      }
    } else {
      return self.blur();
    }
  },

  /**
   * Fired with the mousemove event to update the default cursor.
   * @param  {Event}       e    The mousemove event.
   * @param  {CanvasInput} self
   * @return {CanvasInput}
   */
  mousemove: function(e, self) {
    var mouse = self._mousePos(e),
      x = mouse.x,
      y = mouse.y,
      isOver = self._overInput(x, y);

    if (isOver && self._canvas) {
      self._canvas.style.cursor = 'text';
      self._wasOver = true;
    } else if (self._wasOver && self._canvas) {
      self._canvas.style.cursor = 'default';
      self._wasOver = false;
    }

    if (self._hasFocus && self._selectionStart >= 0) {
      var curPos = self._clickPos(x, y),
        start = Math.min(self._selectionStart, curPos),
        end = Math.max(self._selectionStart, curPos);

      if (!isOver) {
        self._selectionUpdated = true;
        self._endSelection = true;
        delete self._selectionStart;
        self.render();
        return;
      }

      if (self._selection[0] !== start || self._selection[1] !== end) {
        self._selection = [start, end];
        self.render();
      }
    }
  },

  /**
   * Fired with the mousedown event to start a selection drag.
   * @param  {Event} e    The mousedown event.
   * @param  {CanvasInput} self
   */
  mousedown: function(e, self) {
    var mouse = self._mousePos(e),
      x = mouse.x,
      y = mouse.y,
      isOver = self._overInput(x, y);

    // setup the 'click' event
    self._mouseDown = isOver;

    // start the selection drag if inside the input
    if (self._hasFocus && isOver) {
      self._selectionStart = self._clickPos(x, y);
    }
  },

  /**
   * Fired with the mouseup event to end a selection drag.
   * @param  {Event} e    The mouseup event.
   * @param  {CanvasInput} self
   */
  mouseup: function(e, self) {
    var mouse = self._mousePos(e),
      x = mouse.x,
      y = mouse.y;

    // update selection if a drag has happened
    var isSelection = self._clickPos(x, y) !== self._selectionStart;
    if (self._hasFocus && self._selectionStart >= 0 && self._overInput(x, y) && isSelection) {
      self._selectionUpdated = true;
      delete self._selectionStart;
      self.render();
    } else {
      delete self._selectionStart;
    }

    self.click(e, self);
  },

  /**
   * Select a range of text in the input.
   * @param  {Array} range (optional) Leave blank to select all. Format: [start, end]
   * @return {CanvasInput}
   */
  selectText: function(range) {
    var self = this,
      range = range || [0, self._value.length];

    // select the range of text specified (or all if none specified)
    setTimeout(function() {
      self._selection = [range[0], range[1]];
      self._hiddenInput.selectionStart = range[0];
      self._hiddenInput.selectionEnd = range[1];
      self.render();
    }, 1);

    return self;
  },

  /**
   * Clears and redraws the CanvasInput on an off-DOM canvas,
   * and if a main canvas is provided, draws it all onto that.
   * @return {CanvasInput}
   */
  render: function() {
    var self = this,
      ctx = self._ctx,
      w = self.outerW,
      h = self.outerH,
      br = self._borderRadius,
      bw = self._borderWidth;

    if (!ctx) {
      return;
    }

    // Transform to match original code
    ctx.setTransform(1, 0, 0, 1, self._x, self._y);

    // clip the text so that it fits within the box
    var text = self._clipText();

    // draw the selection
    var paddingBorder = self._padding + self._borderWidth;
    if (self._selection[1] > 0) {
      var selectOffset = self._textWidth(text.substring(0, self._selection[0])),
        selectWidth = self._textWidth(text.substring(self._selection[0], self._selection[1]));

      ctx.drawRect(paddingBorder + selectOffset, paddingBorder, selectWidth, self._height, self._selectionColor);
    }

    // draw the cursor
    if (self._cursor) {
      var cursorOffset = self._textWidth(text.substring(0, self._cursorPos));
      ctx.drawRect(paddingBorder + cursorOffset, paddingBorder, 1, self._height, self._fontColor);
    }

    // draw the text
    var textX = self._padding + self._borderWidth,
      textY = Math.round(paddingBorder);

    // only remove the placeholder text if they have typed something
    text = (text === '' && self._placeHolder) ? self._placeHolder : text;

    ctx.drawText(textX, textY, w, h, text, 
      (self._value !== '' && self._value !== self._placeHolder) ? self._fontColor : self._placeHolderColor, self._fontSize);

    ctx.resetTransform();

    return self;
  },

  /**
   * `Destroy` this input and stop rendering it.
   */
  destroy: function() {
    var self = this;

    // pull from the inputs array
    var index = inputs.indexOf(self);
    if (index != -1) {
      inputs.splice(index, 1);
    }

    // remove focus
    if (self._hasFocus) {
      self.blur();
    }

    // remove the hidden input box
    document.body.removeChild(self._hiddenInput);

    self._canvas.removeEventListener('mousemove', self.mouseMoveListener);
    self._canvas.removeEventListener('mouseup', self.mouseUpListener);
    self._canvas.removeEventListener('mousedown', self.mouseDownListener);
  },

  /**
   * Deletes selected text in selection range and repositions cursor.
   * @return {Boolean} true if text removed.
   */
  _clearSelection: function() {
    var self = this;

    if (self._selection[1] > 0) {
      // clear the selected contents
      var start = self._selection[0],
        end = self._selection[1];

      self._value = self._value.substr(0, start) + self._value.substr(end);
      self._cursorPos = start;
      self._cursorPos = (self._cursorPos < 0) ? 0 : self._cursorPos;
      self._selection = [0, 0];

      return true;
    }

    return false;
  },

  /**
   * Clip the text string to only return what fits in the visible text box.
   * @param  {String} value The text to clip.
   * @return {String} The clipped text.
   */
  _clipText: function(value) {
    var self = this;
    value = (typeof value === 'undefined') ? self._value : value;

    var textWidth = self._textWidth(value),
      fillPer = textWidth / (self._width - self._padding),
      text = fillPer > 1 ? value.substr(-1 * Math.floor(value.length / fillPer)) : value;

    return text + '';
  },

  /**
   * Gets the pixel with of passed text.
   * @param  {String} text The text to measure.
   * @return {Number}      The measured width.
   */
  _textWidth: function(text) {
    var self = this,
      ctx = self._ctx;

    return ctx.getTextWidth(text, self._fontSize);
  },

  /**
   * Recalculate the outer with and height of the text box.
   */
  _calcWH: function() {
    var self = this;

    // calculate the full width and height with padding, borders
    self.outerW = self._width + self._padding * 2 + self._borderWidth * 2;
    self.outerH = self._height + self._padding * 2 + self._borderWidth * 2;
  },

  /**
   * Update the size and position of the hidden input (better UX on mobile).
   */
  _updateHiddenInput: function() {
    var self = this;

    self._hiddenInput.style.left = (self._x + self._extraX + (self._canvas ? self._canvas.offsetLeft : 0)) + 'px';
    self._hiddenInput.style.top = (self._y + self._extraY + (self._canvas ? self._canvas.offsetTop : 0)) + 'px';
    self._hiddenInput.style.width = (self._width + self._padding * 2) + 'px';
    self._hiddenInput.style.height = (self._height + self._padding * 2) + 'px';
  },

  /**
   * Checks if a coordinate point is over the input box.
   * @param  {Number} x x-coordinate position.
   * @param  {Number} y y-coordinate position.
   * @return {Boolean}   True if it is over the input box.
   */
  _overInput: function(x, y) {
    var self = this,
      xLeft = x >= self._x + self._extraX,
      xRight = x <= self._x + self._extraX + self._width + self._padding * 2,
      yTop = y >= self._y + self._extraY,
      yBottom = y <= self._y + self._extraY + self._height + self._padding * 2;

    return xLeft && xRight && yTop && yBottom;
  },

  /**
   * Use the mouse's x & y coordinates to determine
   * the position clicked in the text.
   * @param  {Number} x X-coordinate.
   * @param  {Number} y Y-coordinate.
   * @return {Number}   Cursor position.
   */
  _clickPos: function(x, y) {
    var self = this,
      value = self._value;

    // don't count placeholder text in this
    if (self._value === self._placeHolder) {
      value = '';
    }

    // determine where the click was made along the string
    var text = self._clipText(value),
      totalW = 0,
      pos = text.length;

    if (x - (self._x + self._extraX) < self._textWidth(text)) {
      // loop through each character to identify the position
      for (var i=0; i<text.length; i++) {
        totalW += self._textWidth(text[i]);
        if (totalW >= x - (self._x + self._extraX)) {
          pos = i;
          break;
        }
      }
    }

    return pos;
  },

  /**
   * Calculate the mouse position based on the event callback and the elements on the page.
   * @param  {Event} e
   * @return {Object}   x & y values
   */
  _mousePos: function(e) {
    var elm = e.target,
      x = e.pageX,
      y = e.pageY;

    // support touch events in page location calculation
    if (e.touches && e.touches.length) {
      elm = e.touches[0].target;
      x = e.touches[0].pageX;
      y = e.touches[0].pageY;
    } else if (e.changedTouches && e.changedTouches.length) {
      elm = e.changedTouches[0].target;
      x = e.changedTouches[0].pageX;
      y = e.changedTouches[0].pageY;
    }

    var style = document.defaultView.getComputedStyle(elm, undefined),
      paddingLeft = parseInt(style['paddingLeft'], 10) || 0,
      paddingTop = parseInt(style['paddingLeft'], 10) || 0,
      borderLeft = parseInt(style['borderLeftWidth'], 10) || 0,
      borderTop = parseInt(style['borderLeftWidth'], 10) || 0,
      htmlTop = document.body.parentNode.offsetTop || 0,
      htmlLeft = document.body.parentNode.offsetLeft || 0,
      offsetX = 0,
      offsetY = 0;

    // calculate the total offset
    if (typeof elm.offsetParent !== 'undefined') {
      do {
        offsetX += elm.offsetLeft;
        offsetY += elm.offsetTop;
      } while ((elm = elm.offsetParent));
    }

    // take into account borders and padding
    offsetX += paddingLeft + borderLeft + htmlLeft;
    offsetY += paddingTop + borderTop + htmlTop;

    return {
      x: x - offsetX,
      y: y - offsetY
    };
  }
};
