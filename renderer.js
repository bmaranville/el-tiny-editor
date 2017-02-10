// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const {remote} = require('electron')
const {Menu, MenuItem, dialog, app} = remote
const tinymce = require("tinymce")
const fs = require('fs')
const path = require('path')
const beautify = require('js-beautify').html;

let menu
let filename
let working_directory

function save() {
  if (filename == null) {
    saveas();
  } else {
    var output = tinymce.editors[0].getContent({format: 'raw'});
    var fullpath = path.join(working_directory, filename);
    fs.writeFile(filename, beautify(output, {indent_size: 2}), (err) => {
      if (err) throw err;
      console.log('It\'s saved!');
    });
  }
}

function saveas() {
  var options = {
    filters: [
      {name: 'html', extensions: ['htm', 'html']},
      {name: 'All Files', extensions: ['*']}
    ],
    defaultPath: working_directory
  };
  dialog.showSaveDialog(options, function(n) {
    if (n == null) {
      return; // cancelled
    }
    else {
      change_working_directory(path.dirname(n));
      filename = path.basename(n); 
      save();
    }
  });
}

function load() {
  dialog.showOpenDialog({properties: ["openFile"], defaultPath: working_directory}, function(fn) {
    fs.readFile(fn[0], 'utf8', (err, data) => {
      if (err) throw err;
      tinymce.editors[0].setContent(data);
    });
  });
}

function change_working_directory(new_path) {
  working_directory = new_path;
  if (tinymce.activeEditor) {
    var doc = tinymce.activeEditor.getDoc(),
        head = doc.head;
    if (head.getElementsByTagName("base").length == 0) {
      base = document.createElement("base");
      head.appendChild(base);
     }
    base.setAttribute("href", "file://" + new_path + "/");
    tinymce.activeEditor.documentBaseURI.setPath(new_path + "/");
  }
}

function choose_working_directory() {
  dialog.showOpenDialog({properties: ["openDirectory"], defaultPath: working_directory}, function(fn) {
    if (fn) {
      change_working_directory(fn[0]);
    }
  });
}

//menu = Menu.getApplicationMenu();
//menu.items[0].submenu.append(new MenuItem({label: "Save", click: save}));
//menu.items[0].submenu.append(new MenuItem({label: "Save As", click: function() {saveas(filename)}}));
//menu.items[0].submenu.append(new MenuItem({label: "Load", click: load}));

tinymce.PluginManager.add('menusave', function(editor, url) {
    editor.addMenuItem('menuwd', {
        text: 'Set working directory',
        context: 'file',
        //shortcut: 'Ctrl+w',
        onclick: choose_working_directory
    });
    editor.addMenuItem('menuload', {
        text: 'Open',
        context: 'file',
        //shortcut: 'Ctrl+o',
        onclick: load
    });
    editor.addMenuItem('menusave', {
        text: 'Save',
        context: 'file',
        //shortcut: 'Ctrl+s',
        onclick: save
    });
    editor.addMenuItem('menusaveas', {
        text: 'Save As',
        context: 'file',
        //shortcut: 'Ctrl+a',
        onclick: function() {saveas(filename)}
    });
    editor.addMenuItem('menuquit', {
        text: 'Quit',
        context: 'file',
        //shortcut: 'Ctrl+a',
        onclick: function() {app.quit()}
    });
});

tinymce.baseURL = "node_modules/tinymce";

tinymce.init({ 
  selector:'div.tinymce-full',
  height: "100%",
  indent: true,
  theme: 'modern',
  extended_valid_elements : "link[rel|href],a[class|name|href|target|title|onclick|rel],script[type|src],iframe[src|style|width|height|scrolling|marginwidth|marginheight|frameborder],img[class|src|border=0|alt|title|hspace|vspace|width|height|align|onmouseover|onmouseout|name]",
  plugins: [
    'advlist autolink lists link image charmap print hr anchor pagebreak',
    'searchreplace wordcount visualblocks visualchars code fullscreen',
    'insertdatetime media nonbreaking save table contextmenu directionality',
    'emoticons template paste textcolor colorpicker textpattern imagetools codesample toc',
    'menusave',
    'fullpage'
  ],
  file_picker_types: 'image', 
  // and here's our custom image picker
  file_picker_callback: function(cb, value, meta) {
    dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{name: 'Images', extensions: ['jpg', 'png', 'gif', 'svg']}],
      defaultPath: working_directory
    }, function(fn) {
      var filename = path.basename(fn[0]);
      var rel_filename = path.relative(working_directory || "", fn[0]);
      cb(rel_filename, { title: filename});
    });
  }
});
