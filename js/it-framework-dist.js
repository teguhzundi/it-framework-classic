"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function makeid() {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (var i = 0; i < 5; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}return text;
}

function createObject(settings) {
	var xtype = settings.xtype;
	var res = null;
	switch (xtype) {
		case "button":
			res = new Button(settings);
			break;
		case "menu":
			res = new Menu(settings);
			break;
		case "toolbar":
			res = new ToolBar(settings);
			break;
		case "editor":
			res = new Editor(settings);
			break;
		case "combobox":
			res = new ComboBox(settings);
			break;
		case "form":
			res = new Form(settings);
			break;
		case "textbox":
			res = new TextBox(settings);
			break;
		case "checkbox":
			res = new CheckBox(settings);
			break;
		case "imagebox":
			res = new ImageBox(settings);
			break;
		case "html":
			res = new HTML(settings);
			break;
		case "column":
			res = new Column(settings);
			break;
		case "flexbox":
			res = new FlexBox(settings);
			break;
		default:
			res = null;
			console.warn(settings.xtype + " is not registered.");
			break;
	}
	return res;
}

function Event(parent) {
	var settings = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	var me = this;
	this.events = {};

	this.add = function (name, callback) {
		if (typeof callback === 'function') {
			this.events[name] = callback;
		}
	};

	this.getEvents = function () {
		return this.events;
	};

	me.fire = function (events, arg, ret) {
		var ret = ret || parent;
		if (me.events.hasOwnProperty(events) && typeof me.events[events] === 'function') me.events[events].apply(ret, arg);
		if (settings.hasOwnProperty(events) && typeof settings[events] === 'function') settings[events].apply(ret, arg);
	};

	this.set = function (obj) {
		var _this = this;

		var events = {};
		var allEvents = ["blur", "change", "click", "dblclick", "focus", "hover", "keydown", "keypress", "keyup", "show", "hide"];

		$.each(allEvents, function (k, event) {
			var on = "on" + event.substring(0, 1).toUpperCase() + event.substring(1, event.length).toLowerCase();

			events[on] = function (action) {
				_this.add(on, action);
			};

			events[event] = function () {
				obj.trigger(event);
			};

			obj.on(event, function (e) {
				_this.fire(on, [e.currentTarget, e]);
				_this.fire(event, [e.currentTarget, e]);
			});
		});

		return events;
	};
}

function DataTable(options) {
	var _this2 = this;

	var settings = $.extend({
		id: '',
		width: '',
		height: '',
		typeTable: '',
		fixHeader: false,
		wrap: false,
		store: {
			type: 'json',
			params: {
				start: 0,
				limit: 20
			}
		},
		css: {},
		cssInjectRow: {},
		cssInjectCell: {},
		columns: []
	}, options);

	var me = this;
	var id = settings.id == "" ? makeid() : settings.id;
	var DataTable = $("\n\t\t<div class=\"it-grid\">\n\t\t\t<div class=\"it-grid-container\">\n\t\t\t\t<div class=\"it-grid-header-fix\"></div>\n\t\t\t\t<div class=\"it-grid-wrapper-outer\">\n\t\t\t\t\t<div class=\"it-grid-wrapper\">\n\t\t\t\t\t\t<table border=\"1\" width=\"100%\">\n\t\t\t\t\t\t\t<thead></thead>\n\t\t\t\t\t\t\t<tbody></tbody>\n\t\t\t\t\t\t</table>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<nav class=\"it-grid-pagination\">\n\t\t\t\t\t<ul>\n\t\t\t\t\t\t<li> <a href=\"javascript:void(0)\" rel=\"first\"><i class=\"fa fa-caret-left\"></i></a></li>\n\t\t\t\t\t\t<li> <a href=\"javascript:void(0)\" rel=\"back\"><i class=\"fa fa-angle-left\"></i></a></li>\n\t\t\t\t\t\t<li>\n\t\t\t\t\t\t\t<input type=\"text\" class=\"pagination-current\" value=\"1\"> \n\t\t\t\t\t\t\t<span style=\"padding: 0 5px;\">/</span>\n\t\t\t\t\t\t\t<span class=\"pagination-page-count\"></span>\n\t\t\t\t\t\t</li>\n\t\t\t\t\t\t<li> <a href=\"javascript:void(0)\" rel=\"next\"><i class=\"fa fa-angle-right\"></i></a></li>\n\t\t\t\t\t\t<li> <a href=\"javascript:void(0)\" rel=\"last\"><i class=\"fa fa-caret-right\"></i></a></li>\n\t\t\t\t\t\t<li>\n\t\t\t\t\t\t\tMenampilkan \n\t\t\t\t\t\t\t<span class=\"pagination-show\"></span> dari \n\t\t\t\t\t\t\t<span class=\"pagination-count\"></span> Data\n\t\t\t\t\t\t</li>\n\t\t\t\t\t</ul>\n\t\t\t\t</nav>\n\t\t\t</div>\n\t\t</div>\n\t");
	DataTable.attr('id', id);
	DataTable.find('.it-grid-container').addClass(settings.typeTable);

	if (settings.width) DataTable.width(settings.width);
	if (settings.height) DataTable.height(settings.height);
	if (!$.isEmptyObject(settings.css)) DataTable.css(settings.css);

	this.events = new Event(me, settings);
	this.onItemClick = function (act) {
		return _this2.events.add("onItemClick", act);
	};
	this.onItemDblClick = function (act) {
		return _this2.events.add("onItemDblClick", act);
	};

	this.data = null;
	this.page = 1;
	this.pageCount = 1;
	this.params = settings.store.params;
	this.selectedRecord = null;
	this.selectedColumn = null;
	this.hasTdError = false;

	// Begin : Store Data
	this.store = null;
	if (typeof settings.store === 'function') {
		this.store = settings.store;
		this.data = this.store.getData();
	} else {
		this.store = new Store(settings.store);
	}

	this.store.onLoad(function (data, params) {
		me.data = data;
		me.params = params;
		me.load();
	});

	this.store.onError(function (err) {
		alert(err.message);
		return false;
	});

	// End : Store Data
	this.load = function () {
		var opt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

		_this2.selectedColumn = null;
		_this2.selectedRecord = null;
		if (me.data) {
			// Empty table body
			DataTable.find("tbody").empty();

			var totalRows = me.data.total_rows;
			var start = me.params.start;
			var limit = me.params.limit;
			var lastData = start + limit;
			var jmlData = me.data.rows.length;

			lastData = lastData < totalRows ? lastData : totalRows;
			var dataShow = totalRows > 0 ? start + 1 + "/" + lastData : "0";
			var jmlPage = Math.ceil(totalRows / limit);
			me.pageCount = jmlPage;

			DataTable.find('.pagination-show').html(dataShow);
			DataTable.find('.pagination-count').html(totalRows);
			DataTable.find('.pagination-page-count').html(jmlPage);

			$.each(_this2.data.rows, function (k, row) {
				return _this2.createRows(row);
			});
		}
	};

	this.loadPage = function (page) {
		if (this.data) {
			this.page = page;
			this.store.load({
				params: {
					start: (page - 1) * me.params.limit,
					limit: me.params.limit
				}
			});
			DataTable.find('.pagination-current').val(page);
		}
	};

	this.getSelectedRow = function () {
		return this.selectedRecord;
	};

	this.getRecord = function (rec) {
		return this.data && this.data.rows[rec] ? this.data.rows[rec] : null;
	};

	this.getSetting = function () {
		return settings;
	};

	this.getEditedRecords = function () {
		return this.store.dataChanged;
	};

	this.setEditable = function (td) {
		var _this3 = this;

		var editor = td.data().editor;
		var div = td.find("div");
		var value = div.text();

		if (!td.hasClass('it-grid-editing')) {
			td.addClass('it-grid-editing');
			if (editor) {
				var required = typeof editor.required !== "undefined" ? editor.required : false;
				switch (editor.xtype) {
					case "text":
						if (settings.wrap) {
							var input = $('<textarea/>', {
								class: "it-grid-form-control",
								val: value,
								required: required
							}).height(td.height() - 1);
						} else {
							var dontAllow = ["file", "radio", "checkbox", "numeric"];
							var input = $('<input/>', {
								class: "it-grid-form-control",
								type: $.inArray(editor.type, dontAllow) > -1 ? "text" : editor.type,
								val: value,
								required: required
							});
						}
						div.html(input);

						if (editor.minlength != undefined) input.attr('minlength', editor.min);

						if (editor.maxlength != undefined) input.attr('maxlength', editor.max);

						if (editor.type == "rupiah") {
							input.keyup(function (e) {
								var value = $(this).val().replace(/[^,\d]/g, '').toString(),
								    split = value.split(','),
								    sisa = split[0].length % 3,
								    rupiah = split[0].substr(0, sisa),
								    ribuan = split[0].substr(sisa).match(/\d{3}/gi);

								if (ribuan) {
									separator = sisa ? '.' : '';
									rupiah += separator + ribuan.join('.');
								}
								rupiah = split[1] != undefined ? rupiah + ',' + split[1] : rupiah;
								$(this).val(rupiah);
							});
						}

						if (editor.type == "numeric") {
							var min = editor.min != undefined ? editor.min : "";
							var max = editor.max != undefined ? editor.max : "";
							input.keyup(function () {
								var value = $(this).val();
								if (min && value < min) $(this).val(min);
								if (max && value > max) $(this).val(max);
							});
						}

						if (editor.type == "numeric" || editor.type == "rupiah") {
							input.keypress(function (e) {
								if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
									return false;
								}
							});
						}

						input.blur(function (e) {
							var valid = e.target.checkValidity();
							_this3.hasTdError = !valid;
							if (valid) {
								var value = input.val();
								var changed = me.store.cekData(_this3.selectedRecord, settings.columns[_this3.selectedColumn].dataIndex, value);

								div.html(value);
								td.removeClass("it-grid-editing");
								td[changed ? "addClass" : "removeClass"]('it-grid-changed');
								e.preventDefault();
							} else {
								setTimeout(function () {
									return input.focus();
								}, 100);
							}
						});

						input.focus(function (e) {
							return $(e.currentTarget).select();
						});
						input.focus();
						input.keyup();
						input.keypress();

						DataTable.focusout(function (e) {
							if (_this3.hasTdError) {
								setTimeout(function () {
									return input.focus();
								}, 100);
							}
						});
						break;
				}
			}
		}
	};

	this.createRows = function (row) {
		var _this4 = this;

		var tr = $('<tr/>', {
			css: settings.cssInjectRow
		}).appendTo(DataTable.find("tbody"));
		$.each(settings.columns, function (colIndex, col) {
			var div = $('<div/>', {
				width: typeof col.width !== "undefined" ? col.width : "",
				css: {
					'text-align': typeof col.align !== "undefined" ? col.align : "left"
				}
			});
			div[settings.wrap ? "addClass" : "removeClass"]("wrap");

			// value of td
			var value = typeof row[col.dataIndex] !== "undefined" ? row[col.dataIndex] : "";

			// if checkbox
			if (value && typeof col.editor !== "undefined" && col.xtype == "checkbox") {
				var checkbox = $('<input/>', {
					type: "checkbox",
					name: col.dataIndex + "[]",
					val: value,
					checked: value || value == "Y"
				}).appendTo(div);
			} else if (col.items) {
				$.each(col.items, function (k, val) {
					var item = createObject(val);
					if (item) {
						item.extraData = row;
						item.renderTo(div);
					}
				});
			}
			// if image
			else if (value && typeof col.image !== "undefined" && col.image) {
					var url = typeof col.url !== "undefined" ? col.url : "";
					var img = $('<img/>', {
						src: url + value
					}).css({
						height: col.width - 10,
						display: 'block',
						margin: 'auto'
					}).appendTo(div);
				}
				// Jika Text, dll
				else {
						var dataHelper = col.data != undefined ? col.data : null;
						if (dataHelper) {
							$.each(dataHelper, function (k, data) {
								if (data.key == value) {
									value = data.value;
								}
							});
						}
						div.html(value);
					}

			var td = $('<td/>', {
				valign: typeof col.valign !== "undefined" ? col.valign : "top",
				align: typeof col.align !== "undefined" ? col.align : "left",
				width: typeof col.width !== "undefined" ? col.width : "",
				css: settings.cssInjectCell
			}).data(col);

			td.click(function (e) {
				if (!_this4.hasTdError) {
					DataTable.find('tbody tr').removeClass('it-grid-selected');
					tr.addClass('it-grid-selected');
					_this4.selectedRecord = td.parent('tr').index();
					_this4.selectedColumn = td.index();
					var editor = typeof col.editor !== "undefined" ? col.editor : null;
					var locked = typeof _this4.store.storeData.rows[_this4.selectedRecord].locked !== "undefined" ? _this4.store.storeData.rows[_this4.selectedRecord].locked : false;
					if (editor && !locked) _this4.setEditable(td);

					_this4.events.fire("onItemClick", [_this4.getRecord(_this4.getSelectedRow())]);
				}
			});

			td.dblclick(function (e) {
				_this4.events.fire("onItemDblClick", [_this4.getRecord(_this4.getSelectedRow())]);
			});

			// Fill data to td
			td.append(div);
			td.appendTo(tr);
		});
	};

	this.addRow = function (row) {
		var _this5 = this;

		if (!this.hasTdError) {
			setTimeout(function () {
				row = $.extend({}, row, {
					new: true
				});
				_this5.store.storeData.rows.push(row);
				_this5.createRows(row);
				DataTable.find('tbody tr:last-child td:first-child').click();
			}, 100);
		}
	};

	this.removeRow = function (row) {
		this.data.rows.splice(row, 1);
		this.store.storeData.rows.splice(row, 1);
		DataTable.find("tbody > tr:eq(" + row + ")").fadeOut(100, function () {
			$(this).remove();
		});
	};

	this.setPage = function (act) {
		if (_this2.data) {
			var lastPage = Math.ceil(_this2.data.total_rows / _this2.params.limit);
			switch (act) {
				case 'first':
					if (_this2.page != 1) _this2.loadPage(1);
					break;
				case 'last':
					if (_this2.page != lastPage) _this2.loadPage(lastPage);
					break;
				case 'next':
					if (_this2.page < lastPage) _this2.loadPage(_this2.page + 1);
					break;
				case 'back':
					if (_this2.page > 1) _this2.loadPage(_this2.page - 1);
					break;
			}
		}
	};

	this.renderTo = function (obj) {
		var header = $('<tr>');
		if (typeof settings.customHeader !== 'undefined') {
			header = $(settings.customHeader);
		} else {
			$.each(settings.columns, function (k, v) {
				var th = $('<th/>', {
					text: v.header,
					css: {
						width: v.width
					}
				});
				th.appendTo(header);
			});
		}
		DataTable.find('thead').append(header);
		DataTable.find('.it-grid-pagination')[settings.paging ? "show" : "hide"]();
		DataTable.find('.it-grid-pagination > ul li > a').click(function (e) {
			if (me.store.dataChanged.length > 0 && !me.store.isSaved) {
				var msg = new MessageBox({
					type: 'tanya',
					width: '400',
					title: 'Konfirmasi',
					message: 'Data Berubah Belum di Save, Lanjutkan ?',
					buttons: [{
						text: 'Ya',
						handler: function handler() {
							_this2.store.dataChanged = [];
							_this2.store.isSaved = true;
							_this2.setPage($(e.currentTarget).attr('rel'));
						}
					}, {
						text: 'Tidak',
						handler: function handler() {
							return msg.hide();
						}
					}]
				});
			} else {
				_this2.setPage($(e.currentTarget).attr('rel'));
			}
		});

		DataTable.find('.it-grid-pagination .pagination-current').keypress(function (e) {
			if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
				return false;
			}

			if (e.which == 13 && $(e.currentTarget).val()) {
				me.loadPage($(e.currentTarget).val());
			}
		});

		DataTable.appendTo(obj);
		parent = obj;
	};

	this.serializeFromHTML = function () {
		var rows = [];
		DataTable.find("tbody tr").each(function (rowIndex, r) {
			var row = {};
			$(this).find("td").each(function (cellIndex, c) {
				if (settings.columns[cellIndex].dataIndex) {
					row[settings.columns[cellIndex].dataIndex] = $(this).text();
				}
			});
			rows[rowIndex] = row;
		});
		return rows;
	};

	this.getComponent = function () {
		return DataTable;
	};

	return this;
}
// Deprecated
function Grid(options) {
	console.warn("Grid is depecated. move to DataTable.");
	return new DataTable(options);
}

function Store(options) {
	var settings = $.extend({
		type: 'json',
		url: '',
		data: {},
		params: {
			start: 0,
			limit: 20,
			orderBy: '',
			sortBy: ''
		}
	}, options);

	var me = this;
	me.events = new Event(me, settings);
	me.params = {};
	me.storeData = null;
	me.dataChanged = [];
	me.isSaved = false;

	me.beforeLoad = function (act) {
		me.events.add("beforeLoad", act);
	};

	me.afterLoad = function (act) {
		me.events.add("afterLoad", act);
	};

	me.completeLoad = function (act) {
		me.events.add("completeLoad", act);
	};

	me.onLoad = function (act) {
		me.events.add("onLoad", act);
	};

	me.onError = function (act) {
		me.events.add("onError", act);
	};

	me.onChange = function (act) {
		me.events.add("onChange", act);
	};

	me.empty = function () {
		me.dataChanged = [];
		me.storeData = {
			rows: [],
			total_rows: 0
		};
		me.events.fire("onLoad", [me.storeData, me.params]);
	};

	me.load = function (opt) {
		me.events.fire("beforeLoad", [me.storeData]);
		var opt = opt || {};
		switch (settings.type) {
			case "json":
				var params = $.extend(settings.params, opt.params);
				me.params = params;
				me.dataChanged = [];
				$.ajax({
					type: 'POST',
					url: settings.url,
					data: params,
					success: function success(data) {
						if (typeof data.rows != 'undefined' && typeof data.total_rows != 'undefined') {
							me.storeData = data;
							me.events.fire("onLoad", [me.storeData, me.params]);
						} else {
							me.storeData = {};
							me.events.fire("onError", [{
								status: false,
								message: "Format Data Tidak Sesuai"
							}]);
						}
					},
					error: function error() {
						me.events.fire("onError", [{
							status: false,
							message: "Data JSON '" + settings.url + "' Tidak Ditemukan"
						}]);
					},
					complete: function complete() {
						me.events.fire("afterLoad", [me.storeData]);
						me.events.fire("completeLoad", ["satu", "dua"]);
					},
					dataType: settings.type
				});
				break;
			case "array":
				if (typeof settings.data.rows != 'undefined' && typeof settings.data.total_rows != 'undefined') {
					me.storeData = settings.data;
					me.events.fire("onLoad", [me.storeData, me.params]);
				} else {
					me.events.fire("onError", [{
						status: false,
						message: "Data JSON Tidak Ditemukan"
					}]);
				}
				me.events.fire("afterLoad", [me.storeData]);
				me.events.fire("completeLoad", ["satu", "dua"]);
				break;
		}
	};
	if (settings.autoLoad) me.load();
	me.searchData = function (data, key, value) {
		var index = null;
		for (var i = 0; i < data.length; i++) {
			if (data[i][key] == value) {
				index = i;
				break;
			}
		}
		return index;
	};
	var isMoney = function isMoney(value) {
		var m = value.replace(/[$,]/g, "").replace(/\./g, "").replace(/,/g, ".").replace(/\%/g, "");
		return !isNaN(m);
	};
	var isDate = function isDate(value) {
		var d = new Date(value);
		return !isNaN(d);
	};
	me.sort = function (prop, asc) {
		var asc = asc;
		var prop = prop;
		me.storeData.rows = me.storeData.rows.sort(function (a, b) {
			var valueA = a[prop];
			var valueB = b[prop];
			if (!isNaN(valueA) && !isNaN(valueB)) {
				valueA = parseFloat(valueA);
				valueB = parseFloat(valueB);
			} else if (isDate(valueA) && isDate(valueB)) {
				valueA = new Date(valueA);
				valueB = new Date(valueB);
			} else if (isMoney(valueA) && isMoney(valueB)) {
				valueA = parseFloat(valueA.replace(/[$,]/g, "").replace(/\./g, "").replace(/,/g, ".").replace(/\%/g, ""));
				valueB = parseFloat(valueB.replace(/[$,]/g, "").replace(/\./g, "").replace(/,/g, ".").replace(/\%/g, ""));
			}

			if (asc == 'Y') return valueA > valueB;else return valueB > valueA;
		});

		me.events.fire("onLoad", [me.storeData, me.params]);
	};
	me.getParams = function () {
		return me.params;
	};
	me.getData = function () {
		return me.storeData;
	};
	me.setData = function (d) {
		settings.data = d;
	};
	me.getSetting = function () {
		return settings;
	};
	me.cekData = function (index, column, data) {
		if ($.trim(me.storeData.rows[index][column]) != $.trim(data)) {
			var rows = $.extend({
				indexRow: index
			}, me.storeData.rows[index]);
			if (me.searchData(me.dataChanged, 'indexRow', index) == null) {
				me.dataChanged.push(rows);
			}
			me.dataChanged[me.searchData(me.dataChanged, 'indexRow', index)][column] = data;
			me.events.fire("onChange", [{
				index: index,
				data: [me.dataChanged[me.searchData(me.dataChanged, 'indexRow', index)]]
			}]);
			return true;
		} else {
			if (me.searchData(me.dataChanged, 'indexRow', index) != null) {
				me.dataChanged[me.searchData(me.dataChanged, 'indexRow', index)][column] = data;
			}
			return false;
		}
	};

	return me;
}

function Menu(params) {
	var settings = $.extend({
		text: '',
		direction: 'tengah',
		iconCls: '',
		disabled: false,
		items: []
	}, params);

	var me = this;
	var parent = null;
	var id = makeid();
	var items = settings.items;

	var clsDisabled = settings.disabled ? "disabled" : "";
	var icon = settings.iconCls != '' ? '<span class="fa fa-' + settings.iconCls + '"></span>' : '';
	var konten = '<a href="#@" id="' + id + '" class="it-btn ' + clsDisabled + '">' + icon + ' ' + settings.text + '</a><span class="tooDir" style="display:none"></span><ul data-arah="' + settings.direction + '"></ul>';
	var content = $(konten);
	for (var i = 0; i < items.length; i++) {
		if (items[i] === null) continue;
		var li = '<li></li>';
		li = $(li);

		if (typeof items[i].renderTo == 'function') {
			items[i].renderTo(li);
		} else if (_typeof(items[i]) == 'object') {
			item = createObject(items[i]);
			item.renderTo(li);
		}
		content.eq(2).append(li);
	}

	me.renderTo = function (obj) {
		content.appendTo(obj);
		parent = obj;

		parent.click(function (e) {
			var $this = $(this);
			var me_child = $this.children('ul');
			var me_data = typeof me_child.data('arah') != 'undefined' ? me_child.data('arah') : 'tengah';
			var me_dir = $this.children('.tooDir');

			if (!me_child.is(':visible')) {
				$('.it-toolbar div ul').hide();
				$('.it-toolbar div a').removeClass('active');
				$('.it-toolbar div .tooDir').hide();
			}

			if (me_child.length > 0) {
				me_a = me_child.parent().children('a').outerWidth();
				me_b = me_child.outerWidth();
				me_c = me_dir.outerWidth();

				if (me_data == 'tengah') {
					me_child.css('left', (me_a - me_b) / 2);
				} else if (me_data == "kanan") {
					me_child.css({
						'left': 'auto',
						'right': '5px'
					});
				}

				me_dir.css('left', (me_a - me_c) / 2);
				me_child.toggle();
				me_dir.toggle();
				$(this).children('a').toggleClass('active');
			}
			e.stopPropagation();
		});

		$(document).click(function () {
			$('.it-toolbar div ul').hide();
			$('.it-toolbar div a').removeClass('active');
			$('.it-toolbar div .tooDir').hide();
		});
	};
	me.getSetting = function () {
		return settings;
	};
	me.getId = function () {
		return id;
	};
	return me;
}

function ToolBar(params) {
	var settings = $.extend({
		position: 'top',
		items: []
	}, params);

	var id = makeid();
	var items = [];
	var template = $("\n\t\t<nav id=\"" + id + "\" class=\"it-toolbar " + (settings.position == 'bottom' ? 'bottom' : '') + "\">\n\t\t\t<ul class=\"it-toolbar-left left\"></ul>\n\t\t\t<ul class=\"it-toolbar-right right\"></ul>\n\t\t</nav>\n\t");

	$.each(settings.items, function (k, val) {
		var align = typeof val.align !== "undefined" && $.inArray(val.align, ['left', 'right']) > -1 ? val.align : "left";
		var li = $('<li/>');
		var item = null;
		if ((typeof val === "undefined" ? "undefined" : _typeof(val)) === "object") {
			item = createObject(val);
			if (item) {
				items.push(item.getId());
				item.renderTo(li);
				template.find('.it-toolbar-' + align).append(li);
			}
		}
	});

	this.renderTo = function (obj) {
		template.appendTo(obj);
		parent = obj;
	};

	this.getItem = function (index) {
		var currentItem = items[index];
		return typeof currentItem !== "undefined" ? currentItem : null;
	};

	this.getSetting = function () {
		return settings;
	};

	this.getId = function () {
		return id;
	};

	this.getObject = function () {
		return template;
	};

	return this;
}

function Button(params) {
	var _this6 = this;

	var settings = $.extend({
		iconCls: '',
		btnCls: '',
		css: {},
		block: false,
		disabled: false,
		text: '',
		textAlign: 'center',
		id: makeid()
	}, params);

	this.extraData = {};
	this.events = new Event(this, settings);
	this.content = $('<a/>', {
		id: settings.id,
		class: 'it-btn',
		href: 'javascript:void(0)',
		html: settings.text
	});

	this.content.addClass("text-" + settings.textAlign);

	if (!$.isEmptyObject(settings.css)) this.content.css(settings.css);

	if (settings.block) {
		this.content.addClass('it-btn-block');
	}

	if (settings.disabled) this.content.addClass('disabled');

	if (settings.btnCls) this.content.addClass(settings.btnCls);

	if (settings.iconCls) {
		var icon = $('<i/>', {
			class: "mr-2 fa fa-" + settings.iconCls
		});
		if (!settings.text) icon.removeClass('mr-2');
		this.content.prepend(icon);
	}

	if (typeof settings.handler !== 'undefined' && !settings.disabled) {
		this.content.on('handler', function (e, a, b) {
			settings.handler.call(null, a, b);
		});
		this.content.click(function () {
			_this6.content.triggerHandler('handler', [_this6.content, _this6.extraData]);
		});
	}

	$.extend(this, this.events.set(this.content));

	this.renderTo = function (obj) {
		this.content.appendTo(obj);
		parent = obj;
	};

	this.getSetting = function () {
		return settings;
	};

	this.getId = function () {
		return settings.id;
	};

	return this;
}

function Dialog(params) {
	var _this7 = this;

	var settings = $.extend({
		width: 300,
		height: 100,
		autoHeight: true,
		items: [],
		itemsFooter: [],
		title: '',
		iconCls: '',
		autoShow: true
	}, params);

	var id = makeid();
	var icon = settings.iconCls != '' ? '<span class="fa fa-' + settings.iconCls + '"></span>' : '';
	var items = [];
	var template = $("\n\t\t<div id=\"" + id + "\" class=\"it-dialog\">\n\t\t\t<div class=\"it-dialog-content\">\n\t\t\t\t" + (settings.title ? "<div class=\"it-title\">" + icon + " " + settings.title + "</div>" : '') + "\n\t\t\t\t<div class=\"it-dialog-inner\"></div>\n\t\t\t\t<div class=\"it-dialog-footer\"></div>\n\t\t\t</div>\n\t\t</div>\n\t");
	template.find('.it-dialog-content').width(settings.width);
	template.find('.it-dialog-content').css(settings.autoHeight ? 'min-height' : 'height', settings.height);

	this.events = new Event(this, settings);
	this.afterShow = function (act) {
		return _this7.events.add("afterShow", act);
	};
	this.onClose = function (act) {
		return _this7.events.add("onClose", act);
	};
	this.onHide = function (act) {
		return _this7.events.add("onHide", act);
	};

	$.each(settings.items, function (k, val) {
		var item = null;
		if (typeof val.renderTo === 'function') {
			val.renderTo(template.find('.it-dialog-inner'));
			items.push(val);
		} else if ((typeof val === "undefined" ? "undefined" : _typeof(val)) === 'object') {
			item = createObject(val);
			if (item) {
				item.renderTo(template.find(".it-dialog-inner"));
				items.push(item);
			}
		}
	});

	$.each(settings.itemsFooter, function (k, val) {
		var item = null;
		if (typeof val.renderTo === 'function') {
			val.renderTo(template.find('.it-dialog-footer'));
			items.push(val);
		} else if ((typeof val === "undefined" ? "undefined" : _typeof(val)) === 'object') {
			item = createObject(val);
			if (item) {
				item.renderTo(template.find(".it-dialog-footer"));
				items.push(item);
			}
		}
	});

	this.getItem = function (index) {
		return items[index];
	};

	this.getSetting = function () {
		return settings;
	};

	this.getId = function () {
		return id;
	};

	this.hide = function () {
		template.hide();
		this.events.fire("onHide", []);
	};

	this.show = function () {
		template.show();
		this.events.fire("afterShow", []);
	};

	this.destroy = function () {
		console.warn("Dialog .destroy() is deprecated, please use .close()");
		this.close();
	};

	this.isShow = function () {
		return template.is(':visible');
	};

	this.close = function () {
		this.hide();
		template.remove();
		this.events.fire("onClose", []);
	};

	this.getObject = function () {
		return template;
	};

	$('body').append(template);

	if (!settings.autoShow) {
		this.hide();
	} else {
		this.show();
	}

	return this;
}

function ImageBox(params) {
	var settings = $.extend({
		dataIndex: '',
		width: 100,
		height: 100,
		src: '',
		css: {}
	}, params);

	this.content = $('<img/>', {
		src: settings.src,
		class: "it-img",
		attr: {
			width: settings.width,
			height: settings.height
		}
	});

	if (!$.isEmptyObject(settings.css)) {
		this.content.css(settings.css);
	}

	this.setSrc = function (src) {
		this.content.attr('src', src);
		return this;
	};

	this.setData = function (data) {
		this.content.data(data);
		return this;
	};

	this.getData = function () {
		return this.content.data();
	};

	this.renderTo = function (obj) {
		this.content.appendTo(obj);
	};

	this.getSetting = function () {
		return settings;
	};

	this.getId = function () {
		return settings.dataIndex;
	};
}

function Tabs(params) {
	var settings = $.extend({
		items: [],
		skin: '',
		css: {},
		fullscreen: false
	}, params);

	var me = this;
	var parent = null;
	var id = makeid();
	var content = $('<div/>', {
		id: makeid(),
		css: settings.css,
		class: "it-tab" + settings.skin
	});

	var ul = $('<ul/>', {
		class: "clearfix"
	});
	ul.appendTo(content);

	$.each(settings.items, function (i, v) {
		var attrID = "tab_" + id + "_" + i;
		var title = typeof v.tabTitle !== "undefined" ? v.tabTitle : "Tanpa Judul";
		var section = $('<section/>', {
			id: attrID
		}).hide();
		section.appendTo(content);

		if (typeof v.renderTo === "function") {
			v.renderTo(section);
		} else {
			var item = createObject(v);
			item.renderTo(section);
		}

		var li = $('<li>').appendTo(ul);
		var a = $('<a/>', {
			href: '#' + attrID,
			title: title,
			html: title
		}).appendTo(li);
	});

	me.renderTo = function (obj) {
		var $obj = content.children('ul').children().children('a');
		var href = $obj.first().attr('href');

		$obj.removeClass('active');
		$obj.first().addClass('active');
		content.find(href).show();

		$obj.click(function (e) {
			$obj.removeClass('active');
			$(href).hide();
			$obj = $(this);
			$obj.addClass('active');
			href = $obj.attr('href');
			$(href).show();
			e.preventDefault();
		});

		obj.append(content);
		parent = obj;
	};

	me.getSetting = function () {
		return settings;
	};

	me.getId = function () {
		return id;
	};

	return me;
}

function MessageBox(params) {
	var _this8 = this;

	var settings = $.extend({
		type: 'info',
		title: '',
		message: '',
		width: 450,
		height: 50,
		buttons: []
	}, params);

	this.content = $("\n\t\t<div class=\"it-messagebox\">\n\t\t\t<div class=\"it-messagebox-content\">\n\t\t\t\t" + (settings.title ? "<div class=\"it-title\">" + settings.title + "</div>" : "") + "\n\t\t\t\t<div class=\"it-messagebox-inner\">\n\t\t\t\t\t<div class=\"message-icon " + settings.type + "\"></div>\n\t\t\t\t\t" + settings.message + "\n\t\t\t\t</div>\n\t\t\t\t<div class=\"clearfix\">\n\t\t\t\t\t<div class=\"float-right message-buttons\"></div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t");

	this.content.find('.it-messagebox-content').css({
		'width': settings.width,
		'min-height': settings.height
	});

	if (settings.buttons.length) {
		$.each(settings.buttons, function (k, v) {
			var btnClasses = v.btnCls != undefined ? v.btnCls : '';
			var btn = $('<a/>', {
				href: "javascript:void(0)",
				html: v.text,
				class: "it-btn",
				click: function click() {
					var handler = v.handler != undefined ? v.handler : null;
					if (typeof handler == 'function') {
						handler.call();
					} else if (typeof handler == 'string') {
						window[handler]();
					}
					_this8.hide();
				}
			});
			btn.addClass(btnClasses);
			btn.appendTo(_this8.content.find('.message-buttons'));
		});
	} else {
		var btn = $('<a/>', {
			href: "javascript:void(0)",
			class: "it-btn",
			html: "OK",
			click: function click() {
				_this8.hide();
			}
		});
		btn.appendTo(this.content.find('.message-buttons'));
	}

	this.show = function () {
		this.content.show();
	};

	this.hide = function () {
		this.content.remove();
	};

	this.getSetting = function () {
		return settings;
	};

	this.getId = function () {
		return null;
	};

	this.content.appendTo('body');

	setTimeout(function () {
		return _this8.show();
	}, 100);

	return this;
}

function ComboBox(params) {
	var _this9 = this;

	var settings = $.extend({
		dataIndex: '',
		value: '',
		emptyText: '',
		emptyValue: '',
		raw: false,
		autoLoad: true,
		allowBlank: true,
		disabled: false,
		readonly: false,
		width: '',
		dataSource: {
			type: 'array',
			url: '',
			data: []
		}
	}, params);

	var template = $('<select/>', {
		class: "it-form-control",
		name: settings.dataIndex,
		id: settings.dataIndex
	});

	if (settings.width) template.width(settings.width);

	if (settings.readOnly) template.prop('readonly', settings.readOnly);

	if (settings.disabled) template.prop('disabled', settings.disabled);

	if (!settings.allowBlank) template.prop('required', true);

	template.blur(function (e) {
		var valid = e.target.checkValidity();
		template[!valid ? "addClass" : "removeClass"]('invalid');
	});

	this.events = new Event(this, settings);
	this.events.add("hide", function () {
		return template.hide();
	});
	this.events.add("show", function () {
		return template.show();
	});
	this.events.set(template);

	this.onLoad = function (act) {
		return _this9.events.add("onLoad", act);
	};
	this.getId = function () {
		return settings.dataIndex;
	};

	this.getDom = function () {
		return template;
	};

	this.getSelected = function () {
		return template.find('option:selected');
	};

	this.val = function (v) {
		if (typeof v !== "undefined") {
			template.find('option').filter('[value="' + v + '"]').prop("selected", true);
		} else {
			return template.find('option:selected').val();
		}
	};

	this.getDataSource = function () {
		var _this10 = this;

		template.empty();

		if (settings.emptyText) {
			template.append($('<option/>', {
				val: settings.emptyValue,
				text: settings.emptyText
			}));
		}

		switch (settings.dataSource.type) {
			case 'array':
				var data = typeof settings.dataSource.data !== "undefined" ? settings.dataSource.data : null;
				if (data) {
					$.each(data, function (k, val) {
						var extraData = typeof val.data !== "undefined" ? val.data : null;
						template.append($('<option/>', {
							val: val.key,
							html: val.value,
							selected: val.key == settings.value,
							data: extraData
						}));
					});
				}
				this.events.fire("onLoad", [template, data]);
				break;

			case 'ajax':
				$.ajax({
					url: settings.dataSource.url,
					type: settings.dataSource.method || "get",
					data: settings.dataSource.params || {},
					dataType: 'json',
					success: function success(data) {
						var rows = typeof data.rows !== "undefined" ? data.rows : null;
						if (rows && rows.length) {
							$.each(rows, function (k, val) {
								var extraData = typeof val.data !== "undefined" ? val.data : null;
								template.append($('<option/>', {
									val: val.key,
									html: val.value,
									selected: val.key == settings.value,
									data: extraData
								}));
							});
						}
						_this10.events.fire("onLoad", [template, rows]);
					}
				});
				break;

			default:
				throw "type only available for ajax and array";
				break;
		}
	};

	this.getSettings = function () {
		return settings;
	};

	this.setEnabled = function (enable) {
		template.prop('disabled', !enable);
	};

	this.setReadOnly = function (readOnly) {
		template.attr('readonly', readOnly);
	};

	this.setDataSource = function (data) {
		settings.dataSource = data;
		me.getDataSource();
	};

	this.renderTo = function (obj) {
		if (!settings.raw) {
			var wrapper = $('<div/>', { class: "it-form-control-select" });
			template.appendTo(wrapper);
			wrapper.appendTo(obj);
		} else {
			template.appendTo(obj);
		}
	};

	if (settings.autoLoad) {
		this.getDataSource();
	}

	return this;
}

function HTML(params) {
	var _this11 = this;

	var settings = $.extend({
		content: '',
		id: '',
		class: '',
		css: {},
		items: []
	}, params);

	var id = !settings.id ? makeid() : settings.id;
	this.content = $('<div/>', {
		id: id,
		css: settings.css,
		class: settings.class
	});

	if (typeof settings.content === 'string') {
		this.content.html(settings.content);
	} else {
		var html = _typeof(settings.content) === 'object' ? settings.content : $(settings.content);
		html.appendTo(this.content);
	}

	if (settings.items.length) {
		$.each(settings.items, function (k, val) {
			var item = null;
			if (typeof val.renderTo === 'function') {
				val.renderTo(_this11.content);
			} else if ((typeof val === "undefined" ? "undefined" : _typeof(val)) === 'object') {
				item = createObject(val);
				if (item) {
					item.renderTo(_this11.content);
				}
			}
		});
	}

	this.setContent = function (html) {
		this.content.html(html);
	};

	this.renderTo = function (obj) {
		this.content.appendTo(obj);
	};

	this.getSetting = function () {
		return settings;
	};

	this.getId = function () {
		return id;
	};

	return this;
}

function Form(params) {
	var settings = $.extend({
		method: 'POST',
		id: 'Fm',
		url: '',
		width: 'auto',
		css: {},
		fieldDefaults: {
			labelWidth: 100,
			fieldBlock: false
		},
		items: []
	}, params);

	var items = {};
	var content = $('<form/>', {
		method: settings.method,
		action: settings.url,
		name: settings.id,
		id: settings.id,
		enctype: 'multipart/form-data',
		css: settings.css
	});
	content.width('100%');

	content.on('keyup keypress', function (e) {
		var keyCode = e.keyCode || e.which;
		if (keyCode === 13) {
			e.preventDefault();
			return false;
		}
	});

	$('<input/>', {
		type: 'submit',
		css: {
			'display': 'none'
		}
	}).appendTo(content);

	if (settings.items.length > 0) {
		var container = $('<div/>', {
			class: 'it-form',
			width: settings.width
		});

		$.each(settings.items, function (k, component) {
			var formGroup = $('<div/>', {
				class: 'it-form-group'
			});
			formGroup.appendTo(container);
			formGroup[settings.fieldDefaults.fieldBlock ? "addClass" : "removeClass"]('block-view');

			if (_typeof(component.fieldLabel) !== undefined && component.fieldLabel) {
				var label = $('<label/>', {
					class: 'form-label',
					html: component.fieldLabel,
					width: settings.fieldDefaults.fieldBlock ? 'auto' : settings.fieldDefaults.fieldLabel
				});
				label.appendTo(formGroup);
			}

			if (typeof component.renderTo === 'function') {
				component.renderTo(formGroup);
				items[component.getId()] = component;
			} else if ((typeof component === "undefined" ? "undefined" : _typeof(component)) === 'object') {
				var item = createObject(component);
				if (item) {
					item.renderTo(formGroup);
					items[item.getId()] = item;

					if (component.type == "hidden") {
						formGroup.addClass("form-hidden");
						return true;
					}
				}
			}
		});
		container.appendTo(content);
	}

	this.setData = function (data) {
		if (typeof $.fn.autofill !== 'undefined') {
			content.autofill(data);
		} else {
			console.info('For use, please install https://github.com/creative-area/jQuery-form-autofill.git');
		}
	};

	this.getItem = function (index) {
		return items[index];
	};

	this.serializeFormData = function () {
		return new FormData(content[0]);
	};

	this.serializeJSON = function () {
		if (typeof $.fn.serializeJSON !== 'undefined') {
			return content.serializeJSON();
		} else {
			console.info('Must install jQuery serializeJSON.');
		}
	};

	this.serialize = function () {
		return content.serialize();
	};

	this.validate = function () {
		var valid = false;
		content.removeAttr('novalidate');
		content.find('.it-form-control').blur();
		content.find(':submit').click(function (e) {
			valid = content[0].checkValidity();
			if (valid) {
				e.preventDefault();
			}
		});
		content.find(':submit').click();
		return valid;
	};

	this.renderTo = function (obj) {
		content.appendTo(obj);
		parent = obj;
	};

	this.reset = function () {
		content[0].reset();
		content.find('input[type="hidden"]').val('');
	};

	this.getSetting = function () {
		return settings;
	};

	this.getId = function () {
		return id;
	};

	return this;
}

function TextBox(params) {
	var settings = $.extend({
		dataIndex: 'textfield',
		type: 'text',
		maxlength: null,
		minlength: null,
		format: '',
		disabled: false,
		readOnly: false,
		allowBlank: true,
		defaultValue: '',
		placeholder: '',
		css: {}
	}, params);

	var parent = null;
	this.events = new Event(this, settings);

	var inputAllowed = ['text', 'password', 'date', 'email', 'hidden'];
	var input = null;
	if (settings.type == 'textarea') {
		input = $('<textarea/>');
	} else {
		input = $('<input/>', {
			type: $.inArray(settings.type, inputAllowed) > -1 ? settings.type : 'text'
		});
		if (settings.minlength) input.attr('minlength', settings.minlength);
		if (settings.maxlength) input.attr('maxlength', settings.maxlength);

		switch (settings.type) {
			case 'numeric':
				input.keypress(function (e) {
					if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
						return false;
					}
				});
				break;
			case 'date':
				if (typeof $.fn.datepicker !== 'undefined') {
					var pickerOptions = $.extend({}, {
						language: {
							days: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
							daysShort: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
							daysMin: ['Mi', 'Sen', 'Sel', 'Ra', 'Ka', 'Ju', 'Sa'],
							months: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
							monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
							today: 'Hari Ini',
							clear: 'Clear',
							dateFormat: 'dd-mm-yyyy',
							timeFormat: 'hh:ii',
							firstDay: 0
						}
					}, typeof settings.pickerOptions !== 'undefined' ? settings.pickerOptions : {});
					input.attr('type', 'text');
					input.datepicker(pickerOptions);
				} else {
					console.info('Use native date, please install air-datepicker https://github.com/t1m0n/air-datepicker');
				}
				break;
		}
	}

	input.attr({
		name: settings.dataIndex,
		id: settings.dataIndex,
		class: 'it-form-control'
	});

	if (settings.placeholder) input.attr('placeholder', settings.placeholder);

	if (settings.defaultValue) input.val(settings.defaultValue);

	if (settings.disabled) input.prop('disabled', settings.disabled);

	if (settings.readOnly) input.prop('readonly', settings.readOnly);

	if (!settings.allowBlank) input.prop('required', true);

	if (!$.isEmptyObject(settings.css)) input.css(settings.css);

	input.blur(function (e) {
		var valid = e.target.checkValidity();
		input[!valid ? "addClass" : "removeClass"]('invalid');
	});

	var content = input;
	$.extend(this, this.events.set(content));

	this.val = function (v) {
		if ((typeof v === "undefined" ? "undefined" : _typeof(v)) == undefined) {
			return content.val() || "";
		} else {
			content.val(v);
		}
	};

	this.renderTo = function (obj) {
		content.appendTo(obj);
		parent = obj;
	};

	this.getSetting = function () {
		return settings;
	};

	this.getId = function () {
		return settings.dataIndex;
	};

	this.setDisabled = function () {
		var disabled = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

		input.prop('disabled', disabled);
	};

	this.setReadOnly = function () {
		var readonly = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

		input.prop('disabled', readonly);
	};

	this.getObject = function () {
		return content;
	};

	return this;
}

function CheckBox(params) {
	var _this12 = this;

	this.settings = $.extend({
		name: '',
		items: [],
		block: true,
		disableAll: false,
		defaultValue: '',
		css: {}
	}, params);

	this.content = $('<div/>', {
		class: "it-form-control-checkbox"
	});

	if (this.settings.block) this.content.addClass('block');

	if (!$.isEmptyObject(this.settings.css)) this.content.css(this.settings.css);

	if (this.settings.items.length) {
		$.each(this.settings.items, function (index, item) {
			var val = $.extend(true, {
				value: '',
				text: 'Text',
				disabled: false,
				smallText: {
					position: 'append',
					text: ''
				}
			}, item);
			var checked = _this12.settings.defaultValue && _this12.settings.defaultValue == val.value;
			var template = $("\n\t\t\t\t<label> \n\t\t\t\t\t<input type=\"radio\" name=\"" + _this12.settings.name + "\" value=\"" + val.value + "\" " + (checked ? "checked" : "") + "/>\t\t\t\t\t\t\n\t\t\t\t\t" + val.text + "\n\t\t\t\t</label>\n\t\t\t");

			if (val.smallText.text) {
				template[val.smallText.position == "append" ? "append" : "prepend"]($('<small/>', {
					html: val.smallText.text,
					class: val.smallText.position
				}));
			}

			if (_this12.settings.disableAll || _this12.settings.disabled) {
				template.find('input').prop('disabled', true);
			}

			template.appendTo(_this12.content);
		});
	}

	this.renderTo = function (obj) {
		this.content.appendTo(obj);
	};

	return this;
}

function FlexBox(params) {
	var settings = $.extend({
		id: '',
		title: '',
		iconTitle: '',
		direction: 'row',
		wrap: '', //nowrap | wrap | wrap-reverse
		justifyContent: '',
		css: {},
		alignItems: '', //flex-start | flex-end | center | baseline | stretch. Default: stretch
		alignContent: '', //flex-start | flex-end | center | space-between | space-around | stretch. Default: stretch
		items: []
	}, params);

	var me = this;
	var parent = null;
	var id = makeid();

	me.content = $('<div />', {
		id: id,
		class: 'it-flex'
	});
	me.content.css(settings.css);

	if (settings.direction) me.content.addClass('it-flex-dir dir-' + settings.direction);

	if (settings.wrap) me.content.addClass('it-flex-wrap wrap-' + settings.wrap);

	if (settings.justifyContent) me.content.addClass('it-flex-jc jc-' + settings.justifyContent);

	if (settings.alignItems) me.content.addClass('it-flex-ai ai-' + settings.alignItems);

	if (settings.alignContent) me.content.addClass('it-flex-ac ac-' + settings.alignContent);

	if (settings.title) {
		var title = $('<div/>', {
			class: 'it-title',
			html: settings.title
		});
		title.prepend($('<span/>', {
			class: 'fa' + (settings.iconTitle ? ' fa-' + settings.iconTitle : "")
		}));
		me.content.append(title);
	}

	$.each(settings.items, function (k, val) {
		var item = null;
		if (typeof val.renderTo === 'function') {
			val.renderTo(me.content);
		} else if ((typeof val === "undefined" ? "undefined" : _typeof(val)) === 'object') {
			item = createObject(val);
			if (item) {
				item.renderTo(me.content);
			}
		}
	});

	me.renderTo = function (obj) {
		this.content.appendTo(obj);
		parent = obj;
	};

	me.getSetting = function () {
		return settings;
	};
	me.getId = function () {
		return id;
	};
	return me;
}

// Deprecated
function Panel(params) {
	console.warn("Panel is depecated. For the future use FlexBox.");

	var settings = $.extend({
		iconCls: '',
		title: '',
		items: []
	}, params);

	return new FlexBox({
		title: settings.title,
		iconTitle: settings.iconCls,
		direction: 'column',
		items: settings.items
	});
}
