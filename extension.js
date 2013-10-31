const St = imports.gi.St;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils
const Mainloop = imports.mainloop;
const Gettext = imports.gettext;
const Refresh = 1100;

var button = null;
var menu_actor = null;
var timer_cs = null;


function enable() {
  timer_cs = Mainloop.timeout_add(Refresh, function () {
	button = new PanelMenu.Button(0.0);
	_set_panel_display(button);
	_build_menu(button);
	
	Main.panel.addToStatusArea("chatstatus", button, 0, "right");
	timer_cs = null;
  });
}

function disable() {
    if (button) button.destroy();
    button = null;
    menu_actor = null;
    timer_cs = null;
}

function init() {
    let user_locale_path = ExtensionUtils.getCurrentExtension().path + "/locale";
    Gettext.bindtextdomain("chatstatus", user_locale_path);
    Gettext.textdomain("chatstatus");

	let theme = imports.gi.Gtk.IconTheme.get_default();
    theme.append_search_path(ExtensionUtils.getCurrentExtension().path + "/icons");
}


function _set_panel_display(button) {
    if (menu_actor) button.actor.remove_actor(menu_actor);
	
    let icon = new St.Icon({icon_name: 'cs-' + _getStatus(), style_class: "system-status-icon"});

    button.actor.add_actor(icon);
    menu_actor = icon;

	//Call again - watch status changes
	Mainloop.timeout_add(Refresh, function () { _set_panel_display(button); });
}

function _build_menu(button) {
    _add_item(button, Gettext.gettext("Available"), 'available');
    _add_item(button, Gettext.gettext("Busy"), 'dnd');
    _add_item(button, Gettext.gettext("Away"), 'away');
    _add_item(button, Gettext.gettext("Invisible"), 'hidden');
    _add_item(button, Gettext.gettext("Offline"), 'offline');
}

function _add_item(button, status_name, status_code) {
    let item = new PopupMenu.PopupBaseMenuItem;
    button.menu.addMenuItem(item);
    let box = new St.BoxLayout({vertical: false,
				pack_start: false,
				style_class: "chatstatus-menu-box"});
    item.actor.add_child(box);
 
	let label = new St.Label({text: status_name});
    box.add(label);
    item.connect("activate", function () {_setStatus(status_code);});
}

function _getAccountsList() {
  var MCToolListShell = GLib.spawn_command_line_sync('mc-tool list');
  var AccountListTxt = new String(MCToolListShell[1]);
  return new Array(AccountListTxt.split("\n"));
}

function _getStatus() {
  var AccListArr = _getAccountsList();
  var inc = 0;
  var AccName;
  var LastStatus;

  for (inc = 0; inc < AccListArr.length; inc++) {
	AccName = new String(AccListArr[inc]);
	var AccStatus = new String(GLib.spawn_command_line_sync('mc-tool show ' + AccName.replace(/,/g,""))[1]);
	LastStatus = new String(AccStatus.match(/Current:.*/));
  }

  LastStatus = LastStatus.replace(/Current:/,"");
  LastStatus = LastStatus.replace(/\"/g, "");
  LastStatus = LastStatus.replace(/[()0-9]/g, "");
  LastStatus = LastStatus.trim();
  
  return LastStatus;
}

function _setStatus(requested_status){
  var AccListArr = _getAccountsList();
  var inc = 0;
  var AccName;

  for (inc = 0; inc < AccListArr.length; inc++) {
    AccName = new String(AccListArr[inc]);
    AccName = AccName.replace(/,/g,"");
	
	GLib.spawn_command_line_sync('mc-tool request ' + AccName + ' ' + requested_status);
  }
}

