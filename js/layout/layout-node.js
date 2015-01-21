
// Nodes in the layout tree

/*
 * The layout tree currently expands to the east or south in the viewNode
 */

"use strict";

function LayoutNode(jqnode, options) {

  if (options == null)
    options = {};

  var node = this;

  this.nodeid = layoutManager.acquireNodeId();

  // allow specification of splitting
  this.splitEnabled = _.omit(options.splitEnabled); // 4 directions
  // allow view dropped to expansion
  this.noExpansion = options.noExpansion;

  this.centerPane = $("<div class='ui-layout-center'></div>")
    .attr("id", "node" + this.nodeid)
    .css("overflow", "hidden")
    .appendTo(jqnode);
  this.content = $("<div class='view-content'></div>")
    .appendTo(this.centerPane);


  _.each(this.directions, function(element) {
    if (node.splitEnabled[element] === true) {
      node[element + "Pane"] = $("<div class='ui-layout-" + element + "'></div>")
        .appendTo(jqnode);

      if (!node.noExpansion) {
        var w = jqnode.width(), h = jqnode.height(), offset = jqnode.offset();
        $("<div></div>")
          .attr("id", "node" + node.nodeid + "-dropzone-" + element)
          .addClass("view-dropzone view-dropzone-inactive view-dropzone-" + element)
          .droppable({
            disabled: true,
            accept: ".view-floating",
            activeClass: "",
            hoverClass: "ui-state-hover",
            greedy: true,
            tolerance: "pointer",
            over: function(event, ui) {
              $("#node" + node.nodeid + "-expandzone-" + element)
                .removeClass("node-expandzone-inactive");
            },
            out: function(event, ui) {
              $("#node" + node.nodeid + "-expandzone-" + element)
                .addClass("node-expandzone-inactive");
            },
            drop: function(event, ui) {
              $("#node" + node.nodeid + "-expandzone-" + element)
                .addClass("node-expandzone-inactive");
              var viewid = ui.draggable.attr("id").match("[0-9]+")[0];
              viewManager.dockView(viewid, node, element); // element is direction
            }
          })
          .appendTo("#dropzone");

        var div = $("<div></div>")
          .attr("id", "node" + node.nodeid + "-expandzone-" + element)
          .addClass("node-expandzone node-expandzone-inactive node-expandzone-" + element);
        if (element === "east" || element === "west")
          div.insertBefore(node.content);
        else
          div.insertBefore(node.centerPane);
      }
    }
  });
  $("<div></div>")
    .addClass("view-dropzone view-dropzone-center view-dropzone-inactive")
    .attr("id", "node" + node.nodeid + "-dropzone-center")
    .droppable({
      disabled: true,
      accept: ".view-floating",
      activeClass: "",
      hoverClass: "ui-state-hover",
      greedy: true,
      tolerance: "pointer",
      over: function(event, ui) {
        $("#node" + node.nodeid + "-expandzone-center")
          .removeClass("node-expandzone-inactive");
      },
      out: function(event, ui) {
        $("#node" + node.nodeid + "-expandzone-center")
          .addClass("node-expandzone-inactive");
      },
      drop: function(event, ui) {
        $("#node" + node.nodeid + "-expandzone-center")
          .addClass("node-expandzone-inactive");
        var viewid = ui.draggable.attr("id").match("[0-9]+")[0];
        viewManager.dockView(viewid, node, "center");
      }
    })
    .appendTo("#dropzone");
  $("<div></div>")
    .attr("id", "node" + node.nodeid + "-expandzone-center")
    .addClass("node-expandzone node-expandzone-inactive node-expandzone-center")
    .insertBefore(node.content);


  this.layoutOptions = _(_.omit(options)).extend({
    center__onresize: function() {
      var w = node.layout.state.center.innerWidth,
          h = node.layout.state.center.innerHeight;
      for (var i = 0; i < node.views.length; i++) {
        node.views[i].__onResize(w, h);
      }
    }
  });
  this.layout = jqnode.layout(this.layoutOptions);
  this.jqnode = jqnode;
  this.views = [];
  this.children = {}; // 4 directions
  this.childrenOrder = []; // used to determine the replacement when node is removed

  this.childrenSize = {
    east: "40%",
    south: "40%",
    west: "40%",
    north: "40%"
  };
  this.parent = null;
  this.parentDirection = null;
  return this;
}

LayoutNode.prototype.directions = ["east", "south", "north", "west"];


LayoutNode.prototype.addView = function(view) {
  this.views.push(view);
  view.layout = this;
};

LayoutNode.prototype.setChild = function(direction, child, options) {
  if (child == null)
    console.error("setting empty child for LayoutNode");
  if (!options.isExistingChild) {
    this.children[direction] = child;
    this.childrenOrder.push(direction);
  }
  if (options == null)
    options = {};
 // if (options.autoResizeChildren === true) { // TODO: seems that this option is redundant
    this.layout.sizePane(direction, this.childrenSize[direction]);
  //}
  this.layout.show(direction, true, options.noAnimation);
  this.layout.resizeAll();
  child.parent = this;
  child.parentDirection = direction;
};

LayoutNode.prototype.removeChild = function(direction, options) {
  if (options == null)
    options = {};
  this.children[direction] = null;
  this.childrenOrder.splice(this.childrenOrder.indexOf(direction), 1);
  this.layout.hide(direction, options.noAnimation);
  this.layout.resizeAll();
};


LayoutNode.prototype.destroy = function() {
  if (this.parent != null)
    this.parent.removeChild(this.parentDirection);
  if (this.layout == null)
    console.error("null layout being destroyed");

  this.layout.destroy();
  $(this.jqnode.children()).remove();

  var node = this;  // remove dropzones
  _(this.directions).each(function(element) {
    var zonename = "#node" + node.nodeid + "-dropzone-" + element;
    $(zonename).remove();
  });
};

LayoutNode.prototype.rebuildLayout = function() {
  this.layout = this.jqnode.layout(this.layoutOptions);
  for (var i in this.childrenOrder) {
    var dir = this.childrenOrder[i];
    var child = this.children[dir];
    //child.jqnode = this[dir + "Pane"];
    this.setChild(dir, child, {
      autoResizeChildren: true,
      noAnimation: true,
      isExistingChild: true
    });
    child.rebuildLayout();
  }
};

LayoutNode.prototype.showCenterDropzone = function() {
  var w = this.jqnode.width(),
      h = this.jqnode.height(),
      offset = this.jqnode.offset();
  $("#node" + this.nodeid + "-dropzone-center")
    .css(this.getDropzoneProperties("center", w, h, offset))
    .droppable("enable")
    .removeClass("view-dropzone-inactive");
};
LayoutNode.prototype.showDropzones = function() {
  if (this.noExpansion === true)
    console.error("showing dropzones for a non-expansible node");

  var node = this,
      w = this.jqnode.width(),
      h = this.jqnode.height(),
      offset = this.jqnode.offset();

  _.each(this.directions, function(element) {
    if (node.splitEnabled[element] !== true)
      return;

    if (node.children[element]) {
      node.children[element].showDropzones();
      return;
    }
    var zonename = "#node" + node.nodeid + "-dropzone-" + element;
    $(zonename)
      .css(node.getDropzoneProperties(element, w, h, offset))
      .droppable("enable")
      .removeClass("view-dropzone-inactive");
  });

};

LayoutNode.prototype.getDropzoneProperties = function(direction, width, height, offset) {
  var left = width / 2 - 25,
      top = height / 2 - 25;
  var d = 55;
  if (direction === "west")
    left -= d;
  else if (direction === "east")
    left += d;
  else if (direction === "north")
    top -= d;
  else if (direction === "south")
    top += d;
  left += offset.left;
  top += offset.top;
  return {
    "left" : left,
    "top" : top
  };
};



LayoutNode.prototype.expand = function(direction) { // insert a children in a given direction
  if (this.splitEnabled[direction] !== true) {
    console.error("expanding direction", direction, "is not allowed");
    return;
  }
  if (this.children[direction]) {
    // the direction is occupied, insert a new node in between
    var oldchild = this.children[direction];
    // create a temporary div that holds the old subtree
    var wrapper = $("<div></div>")
      .attr("id", "wrp")
      .css("height", oldchild.jqnode.height())
      .css("width", oldchild.jqnode.width())
      .appendTo(this.jqnode);
    $(oldchild.jqnode.children()) // move old subtree contents to the temp place
      .appendTo(wrapper);
    // ui-layout library does not allow redirecting parent,
    // so we rebuild all layouts in the subtree
    // this will destroy all nested layouts!
    oldchild.layout.destroy();

    // create a new child node
    var child = new LayoutNode(this[direction + "Pane"], layoutManager.defaultOptions);
    // move the old subtree to its new place
    $(wrapper.children())
      .appendTo(child[direction + "Pane"]);
    wrapper.remove(); // end of wrapper's mission

    // link the tree, just like singly-linked list
    child.setChild(direction, oldchild, {
      autoResizeChildren: true,
      noAnimation: true
    });
    this.setChild(direction, child, {
      autoResizeChildren: true,
      noAnimation: true
    });

    // the old child's jqnode has changed!
    oldchild.jqnode = child[direction + "Pane"];

    // now rebuild all the layouts in the subtree
    oldchild.rebuildLayout();

    return child;
  } else {
    // the direction is empty, create a new node immediately
    var child = new LayoutNode(this[direction + "Pane"], layoutManager.defaultOptions);
    this.setChild(direction, child, {
      autoResizeChildren: true,
      //noAnimation: true // TODO: check if there is bug
    });
    return child;
  }
};


LayoutNode.prototype.pushupAllViews = function(options) {
  $(this.content).children().appendTo(this.parent.content);
  for (var i in this.views) {
    this.views[i].layout = this.parent; // redirect layout to parent node
    this.views[i].__onResize(this.parent.jqnode.width(), this.parent.jqnode.height());
  }
  this.parent.views = this.parent.views.concat(this.views);
  this.views = [];  // this node temporarily contains no views

  if (this.childrenOrder.length === 0) {
    // no more children
    this.destroy();
    return;
  }

  for (var i in this.childrenOrder) {
    var dir = this.childrenOrder[i];
    if (this.children[dir] == null)
      continue;

    var child = this.children[dir];
    child.pushupAllViews(options);

    break;
  }
};

LayoutNode.prototype.removeView = function(view, options) {
  if (options == null)
    options = {};

  if(this.views.indexOf(view) === -1) {
    console.error("view not found in views");
  }
  this.views.splice(this.views.indexOf(view), 1);

  if (this.views.length > 0)  // TODO: this view still have other tabs
    return;

  for (var i in this.childrenOrder) {
    var dir = this.childrenOrder[i];
    if (this.children[dir] == null) {
      console.error("inconsistent children direction");
    }
    console.log(dir, "pushup");
    var child = this.children[dir];
    child.pushupAllViews(options);
    return; // function stops here!
  }

  // no children, this node is leaf and shall be removed
  // NOTE: not removing when leaf is root (single node tree)
  if (this.parent) {
    this.destroy();
  }

  /*
  if (this.children["east"] || this.children["south"]) {
    // grafting children to this node
    if (this.children["east"]) {
      var child = this.children["east"];
      $(child.centerPane.children()).appendTo(this.centerPane);

      child.layout.destroy();
      $(child.jqnode.children()).remove();

      this.addView(child.views[0]);

      this.removeChild("east", options);
    } else if (this.children["south"]) {
      var descendants = [];
      var now = this;
      while (true) {
        descendants.push(now);
        if (now.children["south"]) now = now.children["south"];
        else break;
      }
      for (var i = 0; i < descendants.length - 1; i++) {
        var now = descendants[i], child = descendants[i + 1];
        $(child.centerPane.children()).appendTo(now.centerPane);
        now.children["south"] = child;

        if (child.children["east"]) {
          var east = child.children["east"];
          now.graft("east", east, options);
        }
        now.addView(child.views[0]);
      }
      var last = descendants[descendants.length - 1];
      last.layout.destroy();
      $(last.jqnode.children()).remove();

      var secondlast = descendants[descendants.length - 2];
      secondlast.removeChild("south", options);
    }
  } else {
    if (this.parent != null) {
      this.layout.destroy(); // do not destroy viewNode
      $(this.jqnode.children()).remove();
      this.parent.removeChild(this.parentDirection, options);
    } else {
      this.allowEastSplit = true;
      this.allowSouthSplit = true;
    }
  }
  */
};





/*
LayoutNode.prototype.relocate = function(jqnode) {
  // reset the jqnode (panes) to point to new div element
  this.jqnode = jqnode;
  this.centerPane = jqnode.children(".ui-layout-center");
  this.northPane = jqnode.children(".ui-layout-north");
  this.westPane = jqnode.children(".ui-layout-west");
  this.southPane = jqnode.children(".ui-layout-south");
  this.eastPane = jqnode.children(".ui-layout-east");
};


LayoutNode.prototype.graft = function(direction, node, options) {
  if (options == null)
    options = {};

  var pane = direction + "Pane";
  if (this.children[direction]) {
    console.error("graft to an existing branch");
  }

  $(node.jqnode.children()).appendTo(this[pane]);
  var exoptions = {};
  _(exoptions).extend(layoutManager.stdOptions);
  exoptions.useExistingNode = true;
  var child = new LayoutNode(this[pane], exoptions);

  child.views.push(node.views[0]);
  child.views[0].layout = child;
  child.allowEastSplit = node.allowEastSplit;
  child.allowSouthSplit = node.allowSouthSplit;

  node.parent.removeChild(node.parentDirection. options);
  node.layout.destroy();

  this.setChild(direction, child, {
    autoResizeChildren: true,
    noAnimation: true
  });
};
*/