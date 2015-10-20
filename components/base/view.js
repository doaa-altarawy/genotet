/**
 * @fileoverview Contains the definition of the View class.
 */

'use strict';

/**
 * The base View class. Each component view shall inherit this class.
 * @param viewName Name of the view.
 * @constructor
 */
function View(viewName) {
  var view = this;

  /** @private {string} */
  this.viewName_ = viewName;

  /** @private {string} */
  this.headerText_ = '';

  /** @private {?jQuery} */
  this.container = null;

  $('<div></div>')
    .addClass('view')
    .load('templates/view.html', function() {
      view.container = $(this).appendTo('#main');
      view.init();
    });
  /*
  var layout = this.layout;
  this.parentView = null;
  this.childrenView = new Array();
  this.layout.parentView = this;
  if (this.loader) this.loader.parentView = this;

  $('#view'+ this.viewid + ' .ui-icon-gripsmall-diagonal-se')
    .removeClass('ui-icon-gripsmall-diagonal-se ui-icon'); // hide the handle!

  if (this.type !== 'menu') {
    $('#view' + this.viewid).addClass('viewshadow');
    $('#view' + this.viewid).draggable({
      snap: true,
      handle: 'h3.ui-widget-header',
      start: function(event, ui) {
        view.startPos = ui.position;
      },
      drag: function(event, ui) {
        var top = ui.position.top - view.startPos.top, left = ui.position.left - view.startPos.left;
        //top = Math.ceil(top);
        //left = Math.ceil(left);
        ViewManager.groupMove(view.groupid, view.viewid, {
          top: top,
          left: left
        });
        view.startPos = ui.position;
      },
      stop: function(event, ui) {
        var top = ui.position.top - view.startPos.top, left = ui.position.left - view.startPos.left;
        //top = Math.ceil(top);
        //left = Math.ceil(left);
        ViewManager.groupMove(view.groupid, view.viewid, {
          'top' : top,
          'left' : left
        });
      }
    });
    $('#view' + this.viewid).resizable({
      grid: 10,
      handles: ' n, e, s, w, ne, se, sw, nw',
      resize: function(event, ui) {
        layout.resizeLayout([Math.ceil(ui.size.width), Math.ceil(ui.size.height)]);
      },
      stop: function(event, ui) {
        var wratio = ui.size.width / ui.originalSize.width, hratio = ui.size.height / ui.originalSize.height;
        ViewManager.groupResize(view.groupid, view.viewid, wratio, hratio);
      }
    });
    $('#view' + this.viewid + ' h3:first').append("<button id='closeButton' style='float:right; height:16px; width:16px'></button>");
    $('#view' + this.viewid + ' h3:first').append("<button id='miniButton' style='margin-right:2px; float:right; height:16px; width:16px' title='Minimize view, show/hide UI bar'></button>");
    $('#view' + this.viewid + ' h3:first').append("<button id='helpButton' style='margin-right:2px; float:right; height:16px; width:16px' title='View the help document of this view'></button>");
    if (type != 'menu') {
      $('#view' + this.viewid + ' h3:first').append("<button id='postButton' style='margin-right:2px; float:left; height:16px; width:16px' title='Hover: highlight listeners; Click: add listener; RightClick: remove all listeners'></button>");
      $('#view' + this.viewid + ' h3:first').append("<button id='getButton' style='margin-right:2px; float:left; height:16px; width:16px' title='Hover: highlight listening view; Click: add listening view; RightClick: remove listening view'></button>");
      $('#view' + this.viewid + ' h3:first').append("<button id='groupButton' style='margin-right:2px; float:left; height:16px; width:16px' title='Hover: highlight view group; Click: edit group; RightClick: quit the current group'></button>");
    }

    $('#view' + this.viewid + ' #postButton').button({
      icons: {
        primary: 'ui-icon-signal-diag'
      },
      text: false
    }).mouseover(function() {
      view.highlightChildren();
    }).mouseleave(function() {
      view.unhighlightChildren();
    }).mousedown(function(e) {
      view.postEdit(e);
    });
    $('#view' + this.viewid + ' #groupButton').button({
      icons: {
        primary: 'ui-icon-newwin'
      },
      text: false
    }).mouseover(function() {
      ViewManager.highlightGroup(view.groupid);
    }).mouseleave(function() {
      ViewManager.unhighlightGroup(view.groupid);
    }).mousedown(function(e) {
      view.groupEdit(e);
    });
    $('#view' + this.viewid + ' #getButton').button({
      icons: {
        primary: 'ui-icon-signal'
      },
      text: false
    }).mouseover(function() {
      view.highlightParent();
    }).mouseleave(function() {
      view.unhighlightParent();
    }).mousedown(function(e) {
      view.getEdit(e);
    });
    $('#view' + this.viewid + ' #helpButton').button({
      icons: {
        primary: 'ui-icon-help'
      },
      text: false
    }).click(function() {
      view.help(view.type);
    });
    $('#view' + this.viewid + ' #miniButton').button({
      icons: {
        primary: 'ui-icon-minus'
      },
      text: false
    }).click(function() {
      view.toggleCompactLayout();
    });
    $('#view' + this.viewid + ' #closeButton').button({
      icons: {
        primary: 'ui-icon-close'
      },
      text: false
    }).click(function() {
      closeView(view.viewname);
    });

    $('#view' + this.viewid).mousedown(function() {
      ViewManager.setTopView(view.groupid, view.viewid);
    }).dblclick(function() {
      view.toggleViewheader();
    });
    $('#view' + this.viewid).css({
      'min-width' : 100
    });
    ViewManager.setTopView(this.groupid, this.viewid);
  }
  */
}

/**
 * Initializes the view: adds the mouse event listeners, sets the header.
 */
View.prototype.init = function() {
  this.container
    .draggable({
      handle: '.view-header',
      snap: true
    })
    .resizable({
      handles: 'all'
    })
    .css({ // TODO(bowen): use better size init mechanism
      width: 500,
      height: 300
    });

  var pos = ViewManager.findPosition(this);
  this.container.css(pos);

  this.headerText(this.viewName_);

  // Set up focus event hook.
  this.container.click(function(event) {
    ViewManager.blurAllViews();
    this.focus();
    // Prevent event from hitting the background, which would blur the view.
    event.stopPropagation();
  }.bind(this));

  // Set up close event hook.
  this.container.find('.close').click(function(event) {
    ViewManager.closeView(this);
    this.close();
  }.bind(this));
};

/**
 * Sets the view name. If null, return the current view name.
 * @param {?string} name View name.
 */
View.prototype.name = function(name) {
  if (!name) {
    return this.viewName_;
  }
  this.viewName_ = name;
};

/**
 * Sets the header text of the view. If null, return the current header.
 * @param {?string} headerText View header text.
 */
View.prototype.headerText = function(headerText) {
  if (!headerText) {
    return this.headerText_;
  }
  this.headerText_ = headerText;
  this.container.find('#header-text')
    .text(this.headerText_);
};

/**
 * Makes the view appear focused.
 */
View.prototype.focus = function() {
  if (!this.container) {
    return;
  }
  this.container.addClass('focused');
  // Re-append to appear on top of other views.
  this.container.appendTo('#main');
};

/**
 * Removes the focused effect of the view.
 */
View.prototype.blur = function() {
  if (!this.container) {
    return;
  }
  this.container.removeClass('focused');
};

/**
 * Closes the view and removes it from the screen.
 */
View.prototype.close = function() {
  if (!this.container) {
    return;
  }
  this.container.remove();
};

/**
 * Gets the rectangle area the view occupies.
 * @return {{x: number, y: number, w: number, h: number}}
 */
View.prototype.rect = function() {
  return {
    x: this.container.position().left,
    y: this.container.position().top,
    w: this.container.outerWidth(),
    h: this.container.outerHeight()
  };
};
