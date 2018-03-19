String.prototype.format = function () {
	tmp = arguments;
	return this.replace(/\{(\d+)\}/g, function (m, i) {
		return tmp[i];
	});
}

Array.prototype.remove = function (name, value) {
	var rest = $.grep(this, function (item) {
		return (item[name] !== value);
	});

	this.length = 0;
	this.push.apply(this, rest);
	return this;
};

Array.prototype.insert = function (index, item) {
	this.splice(index, 0, item);
};

function empty(value) {
	return !value;
}

function makeid() {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (var i = 0; i < 5; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
}

// Deleted Method
function getStyle(obj) { }

function createObject(settings) {
	xtype = settings.xtype;
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

function Event(parent, settings = {}) {
	var me = this;
	this.events = {};

	this.add = function (name, callback) {
		if (typeof callback === 'function') {
			this.events[name] = callback;
		}
	}

	this.getEvents = function () {
		return this.events;
	}

	me.fire = function (events, arg, ret) {
		var ret = ret || parent;
		if (me.events.hasOwnProperty(events) && typeof me.events[events] === 'function')
			me.events[events].apply(ret, arg);
		if (settings.hasOwnProperty(events) && typeof settings[events] === 'function')
			settings[events].apply(ret, arg);
	}

	this.set = function (obj) {
		var events = {};
		var allEvents = ["blur", "change", "click", "dblclick", "focus", "hover", "keydown", "keypress", "keyup", "show", "hide"];

		$.each(allEvents, (k, event) => {
			var on = "on" + event.substring(0, 1).toUpperCase() + event.substring(1, event.length).toLowerCase();

			events[on] = (action) => {
				this.add(on, action);
			}

			events[event] = function () {
				obj.trigger(event);
			}

			obj.on(event, (e) => {
				this.fire(on, [e.currentTarget, e]);
				this.fire(event, [e.currentTarget, e]);
			});
		});

		return events;
	}
}

function DataTable(options) {
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
				limit: 20,
			}
		},
		css: {},
		cssInjectRow: {},
		cssInjectCell: {},
		columns: [],
	}, options);

	var me = this;
	var parent = null;
	var id = settings.id == "" ? makeid() : settings.id;
	var lastRow = null;
	var DataTable = $(`
		<div class="it-grid">
			<div class="it-grid-container">
				<div class="it-grid-header-fix"></div>
				<div class="it-grid-wrapper">
					<table border="1" width="100%">
						<thead></thead>
						<tbody></tbody>
					</table>
				</div>
				<nav class="it-grid-pagination">
					<ul>
						<li> <a href="javascript:void(0)" rel="first"><i class="fa fa-caret-left"></i></a></li>
						<li> <a href="javascript:void(0)" rel="back"><i class="fa fa-angle-left"></i></a></li>
						<li>
							<input type="text" class="pagination-current" value="1"> 
							<span style="padding: 0 5px;">/</span>
							<span class="pagination-page-count"></span>
						</li>
						<li> <a href="javascript:void(0)" rel="next"><i class="fa fa-angle-right"></i></a></li>
						<li> <a href="javascript:void(0)" rel="last"><i class="fa fa-caret-right"></i></a></li>
						<li>
							Menampilkan 
							<span class="pagination-show"></span> dari 
							<span class="pagination-count"></span> Data
						</li>
					</ul>
				</nav>
			</div>
		</div>
	`);
	DataTable.attr('id', id);
	DataTable.find('.it-grid-container').addClass(settings.typeTable);

	if (settings.width) DataTable.width(settings.width);
	if (settings.height) DataTable.height(settings.height);
	if (!$.isEmptyObject(settings.css)) DataTable.css(settings.css);

	this.events = new Event(me, settings);
	this.onItemClick = (act) => this.events.add("onItemClick", act);
	this.onItemDblClick = (act) => this.events.add("onItemDblClick", act);

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
	this.load = (opt = {}) => {
		if (me.data) {
			// Empty table body
			DataTable.find("tbody").empty();

			var totalRows = me.data.total_rows;
			var start = me.params.start;
			var limit = me.params.limit;
			var lastData = (start + limit);
			var jmlData = me.data.rows.length;

			lastData = lastData < totalRows ? lastData : totalRows;
			var dataShow = totalRows > 0 ? (start + 1) + "/" + lastData : "0";
			var jmlPage = Math.ceil(totalRows / limit);
			me.pageCount = jmlPage;

			DataTable.find('.pagination-show').html(dataShow);
			DataTable.find('.pagination-count').html(totalRows);
			DataTable.find('.pagination-page-count').html(jmlPage);

			$.each(this.data.rows, (k, row) => this.createRows(row));
		}
	}

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
	}

	this.getSelectedRow = function () {
		return this.selectedRecord;
	}

	this.getRecord = function (rec) {
		return this.data && this.data.rows[rec] ? this.data.rows[rec] : null;
	}

	this.getSetting = function () {
		return settings;
	}

	this.getEditedRecords = function () {
		return this.store.dataChanged;
	}

	this.setEditable = function (td) {
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

						if (editor.minlength != undefined)
							input.attr('minlength', editor.min);

						if (editor.maxlength != undefined)
							input.attr('maxlength', editor.max);

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
								if (min && value < min) $(this).val(min)
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

						input.blur((e) => {
							var valid = e.target.checkValidity();
							this.hasTdError = !valid;
							if (valid) {
								var value = input.val();
								var changed = me.store.cekData(this.selectedRecord, settings.columns[this.selectedColumn].dataIndex, value);

								div.html(value);
								td.removeClass("it-grid-editing");
								td[changed ? "addClass" : "removeClass"]('it-grid-changed');
								e.preventDefault();
							} else {
								setTimeout(() => input.focus(), 100);
							}
						});

						input.focus((e) => $(e.currentTarget).select());
						input.focus();
						input.keyup();
						input.keypress();

						DataTable.focusout((e) => {
							if (this.hasTdError) {
								setTimeout(() => input.focus(), 100);
							}
						});
						break;
				}
			}
		}
	}

	this.createRows = function (row) {
		var tr = $('<tr/>', { css: settings.cssInjectRow }).appendTo(DataTable.find("tbody"));
		$.each(settings.columns, (colIndex, col) => {
			var div = $('<div/>', {
				width: typeof col.width !== "undefined" ? col.width : "",
				css: {
					'text-align': typeof col.align !== "undefined" ? col.align : "left",
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
					checked: (value || value == "Y")
				}).appendTo(div);
			}
			// if image
			else if (value && typeof col.image !== "undefined" && col.image) {
				var url = typeof col.url !== "undefined" ? col.url : "";
				var img = $('<img/>', {
					src: url + value
				})
					.css({
						width: 80,
						height: 80,
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

			td.click((e) => {
				if (!this.hasTdError) {
					DataTable.find('tbody tr').removeClass('it-grid-selected');
					tr.addClass('it-grid-selected');
					this.selectedRecord = td.parent('tr').index();
					this.selectedColumn = td.index();
					var editor = typeof col.editor !== "undefined" ? col.editor : null;
					var locked = typeof this.store.storeData.rows[this.selectedRecord].locked !== "undefined" ? this.store.storeData.rows[this.selectedRecord].locked : false;
					if (editor && !locked)
						this.setEditable(td);

					this.events.fire("onItemClick", [this.getRecord(this.getSelectedRow())]);
				}
			});

			td.dblclick((e) => {
				this.events.fire("onItemDblClick", [this.getRecord(this.getSelectedRow())]);
			});

			// Fill data to td
			td.append(div);
			td.appendTo(tr);
		});
	}

	this.addRow = function (row) {
		if (!this.hasTdError) {
			setTimeout(() => {
				row = $.extend({}, row, {
					new: true
				});
				this.store.storeData.rows.push(row);
				this.createRows(row);
				DataTable.find('tbody tr:last-child td:first-child').click();
			}, 100);
		}
	}

	this.removeRow = function (row) {
		var deleted = this.data.rows.splice(row, 1);
		DataTable.find(`tbody > tr:eq(${row})`).fadeOut(100, function () {
			$(this).remove();
		});
	};

	this.setPage = (act) => {
		if (this.data) {
			var lastPage = Math.ceil(this.data.total_rows / this.params.limit);
			switch (act) {
				case 'first':
					if (this.page != 1)
						this.loadPage(1);
					break;
				case 'last':
					if (this.page != lastPage)
						this.loadPage(lastPage);
					break;
				case 'next':
					if (this.page < lastPage)
						this.loadPage(this.page + 1);
					break;
				case 'back':
					if (this.page > 1)
						this.loadPage(this.page - 1);
					break;
			}
		}
	}

	this.renderTo = (obj) => {
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
		DataTable.find('.it-grid-pagination > ul li > a').click((e) => {
			if (me.store.dataChanged.length > 0 && !me.store.isSaved) {
				var msg = MessageBox({
					type: 'tanya',
					width: '400',
					title: 'Konfirmasi',
					message: 'Data Berubah Belum di Save, Lanjutkan ?',
					buttons: [{
						text: 'Ya',
						handler: () => {
							this.store.dataChanged = [];
							this.store.isSaved = true;
							this.setPage($(e.currentTarget).attr('rel'));
						}
					}, {
						text: 'Tidak',
						handler: () => msg.hide()
					}]
				});
			} else {
				this.setPage($(e.currentTarget).attr('rel'));
			}
		});

		DataTable.find('.it-grid-pagination .pagination-current').keypress((e) => {
			if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
				return false;
			}

			if (e.which == 13 && $(e.currentTarget).val()) {
				me.loadPage($(e.currentTarget).val());
			}
		});

		DataTable.appendTo(obj);
		parent = obj;
	}

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
	}

	this.getComponent = function () {
		return DataTable;
	}

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
	}

	me.afterLoad = function (act) {
		me.events.add("afterLoad", act);
	}

	me.completeLoad = function (act) {
		me.events.add("completeLoad", act);
	}

	me.onLoad = function (act) {
		me.events.add("onLoad", act);
	}

	me.onError = function (act) {
		me.events.add("onError", act);
	}

	me.onChange = function (act) {
		me.events.add("onChange", act);
	}

	me.empty = function () {
		me.dataChanged = [];
		me.storeData = {
			rows: [],
			total_rows: 0
		};
		me.events.fire("onLoad", [me.storeData, me.params]);
	}

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
					success: function (data) {
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
					error: function () {
						me.events.fire("onError", [{
							status: false,
							message: "Data JSON '" + settings.url + "' Tidak Ditemukan"
						}]);
					},
					complete: function () {
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
	}
	if (settings.autoLoad) me.load();
	me.searchData = function (data, key, value) {
		index = null;
		for (i = 0; i < data.length; i++) {
			if (data[i][key] == value) {
				index = i;
				break;
			}
		}
		return index;
	}
	var isMoney = function (value) {
		var m = value.replace(/[$,]/g, "").replace(/\./g, "").replace(/,/g, ".").replace(/\%/g, "");
		return !isNaN(m);
	}
	var isDate = function (value) {
		var d = new Date(value);
		return !isNaN(d);
	}
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

			if (asc == 'Y') return (valueA > valueB);
			else return (valueB > valueA);
		});

		me.events.fire("onLoad", [me.storeData, me.params]);
	}
	me.getParams = function () {
		return me.params;
	}
	me.getData = function () {
		return me.storeData;
	}
	me.setData = function (d) {
		settings.data = d;
	}
	me.getSetting = function () {
		return settings;
	}
	me.cekData = function (index, column, data) {
		if ($.trim(me.storeData.rows[index][column]) != $.trim(data)) {
			rows = $.extend({
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
	}

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
	var konten = '<a href="#@" id="' + id + '" ' + getStyle(settings) + ' class="it-btn ' + clsDisabled + '">' + icon + ' ' + settings.text + '</a><span class="tooDir" style="display:none"></span><ul data-arah="' + settings.direction + '"></ul>';
	var $konten = $(konten);
	for (var i = 0; i < items.length; i++) {
		if (items[i] === null) continue;
		var li = '<li></li>';
		li = $(li);

		if (typeof items[i].renderTo == 'function') {
			items[i].renderTo(li);
		} else if (typeof items[i] == 'object') {
			item = createObject(items[i]);
			item.renderTo(li);
		}
		$konten.eq(2).append(li);
	}

	me.renderTo = function (obj) {
		$konten.appendTo(obj);
		parent = obj;

		parent.click(function (e) {
			var $this = $(this);
			var me_child = $this.children('ul');
			var me_data = (typeof me_child.data('arah') != 'undefined' ? me_child.data('arah') : 'tengah');
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
	}
	me.getSetting = function () {
		return settings;
	}
	me.getId = function () {
		return id;
	}
	return me;
}

function ToolBar(params) {
	var settings = $.extend({
		position: 'top',
		items: []
	}, params);

	var parent = null;
	var id = makeid();
	var items = [];
	var template = $(`
		<nav id="${id}" class="it-toolbar ` + (settings.position == 'bottom' ? 'bottom' : '') + `">
			<ul class="it-toolbar-left left"></ul>
			<ul class="it-toolbar-right right"></ul>
		</nav>
	`);

	$.each(settings.items, (k, val) => {
		var align = typeof val.align !== "undefined" && $.inArray(val.align, ['left', 'right']) > -1 ? val.align : "left";
		var li = $('<li/>');
		var item = null;
		if (typeof val === "object") {
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
	}

	this.getItem = function (index) {
		var currentItem = items[index];
		return typeof currentItem !== "undefined" ? currentItem : null;
	}

	this.getSetting = function () {
		return settings;
	}

	this.getId = function () {
		return id;
	}

	return this;
}

function Button(params) {
	var settings = $.extend({
		iconCls: '',
		btnCls: '',
		css: {},
		disabled: false,
		text: '',
		id: '',
	}, params);

	var me = this;
	var parent = null;
	me.events = new Event(me, settings);
	var id = settings.id == '' ? makeid() : settings.id;
	var icon = settings.iconCls != '' ? '<span class="fa fa-' + settings.iconCls + '"></span>' : '';
	var clsDisabled = settings.disabled ? "disabled" : "";
	var konten = '<a href="javascript:void(0)" id="' + id + '" class="it-btn ' + clsDisabled + ' ' + settings.btnCls + '" ' + getStyle(settings) + '>' + icon + ' ' + settings.text + '</a>';
	var $konten = $(konten);
	$konten.css(settings.css);

	if (typeof settings.handler != 'undefined' && !settings.disabled) {
		$konten.click(function () {
			var handler = settings.handler;
			if (typeof handler == 'function') {
				handler.call();
			} else if (typeof handler == 'string') {
				window[handler]();
			}
		});
	}

	$.extend(me, me.events.set($konten));

	me.renderTo = function (obj) {
		$konten.appendTo(obj);
		parent = obj;
	}

	me.getSetting = function () {
		return settings;
	}
	me.getId = function () {
		return id;
	}
	return me;
}

function Dialog(params) {
	var settings = $.extend({
		width: 300,
		height: 100,
		autoHeight: true,
		items: [],
		padding: 5,
		modal: true,
		clear: false,
		title: '',
		iconCls: '',
		autoShow: true,
	}, params);

	var id = makeid();
	var icon = settings.iconCls != '' ? '<span class="fa fa-' + settings.iconCls + '"></span>' : '';
	var items = [];
	var template = $(`
		<div class="it-dialog">
			<div class="it-dialog-content">
				<div class="it-title">${icon} ${settings.title}</div> 
				<div class="it-dialog-inner"></div>
			</div>
		</div>
	`);
	template.find('.it-dialog-content').width(settings.width);
	template.find('.it-dialog-content').css(settings.autoHeight ? 'min-height' : 'height', settings.height);
	template.find('.it-dialog-content').css('overflow-y', settings.autoHeight ? 'none' : 'auto');
	template.find('.it-dialog-content').draggable({
		handle: '.it-title',
		appendTo: "body",
		start: function () {
			$(this).css({
				"-webkit-transition": "none",
				"-moz-transition": "none",
				"-ms-transition": "none",
				"transition": "none"
			});
		}
	});

	this.events = new Event(this, settings);
	this.afterShow = (act) => this.events.add("afterShow", act);
	this.onClose = (act) => this.events.add("onClose", act);
	this.onHide = (act) => this.events.add("onHide", act);

	$.each(settings.items, (k, val) => {
		var item = null;
		if (typeof val.renderTo === 'function') {
			val.renderTo(template.find('.it-dialog-inner'));
			items.push(val);
		} else if (typeof val === 'object') {
			item = createObject(val);
			if (item) {
				item.renderTo(template.find(".it-dialog-inner"));
				items.push(item);
			}
		}
	});

	this.getItem = function (index) {
		return items[index];
	}

	this.getSetting = function () {
		return settings;
	}

	this.getId = function () {
		return id;
	}

	this.hide = function () {
		template.hide();
		this.events.fire("onHide", []);
	}

	this.show = function () {
		this.events.fire("afterShow", []);
	}

	this.destroy = function () {
		console.warn("Dialog .destroy() is deprecated, please use .close()");
		this.close();
	}

	this.close = function () {
		this.hide();
		setTimeout(function () {
			template.remove();
			me.events.fire("onClose", []);
		}, 600);
	}

	$('body').append(template);

	if (settings.autoShow) {
		this.show();
	}

	return this;
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
		class: "it-tab" + settings.skin,
	});

	var ul = $('<ul/>', {
		class: "clearfix"
	});
	ul.appendTo(content);

	$.each(settings.items, function (i, v) {
		var attrID = `tab_${id}_${i}`;
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
	}

	me.getSetting = function () {
		return settings;
	}

	me.getId = function () {
		return id;
	}

	return me;
}

function MessageBox(params) {
	var settings = $.extend({
		type: 'info',
		title: 'Judul',
		message: '',
		width: 450,
		height: 50,
		buttons: [],
	}, params);

	var me = this;
	var buttons = settings.buttons;
	var MessageBox = $(`
		<div class="it-messagebox">
			<div class="it-messagebox-content">
				<div class="it-title">${settings.title}</div>
				<div class="it-messagebox-inner">
					<div class="message-icon ${settings.type}"></div>
					${settings.message}
				</div>
				<div class="clearfix">
					<div class="float-right message-buttons"></div>
				</div>
			</div>
		</div>
	`);

	MessageBox.find('.it-messagebox-content').css({
		'width': settings.width,
		'min-height': settings.height
	}).draggable({
		handle: '.it-title',
		appendTo: "body",
		start: function () {
			$(this).css({
				"-webkit-transition": "none",
				"-moz-transition": "none",
				"-ms-transition": "none",
				"transition": "none"
			});
		}
	});

	if (buttons.length) {
		$.each(buttons, (k, v) => {
			var btnClasses = v.btnCls != undefined ? v.btnCls : '';
			var btn = $('<a/>', {
				href: "javascript:void(0)",
				html: v.text,
				class: "it-btn",
				click: function () {
					var handler = v.handler != undefined ? v.handler : null;
					if (typeof handler == 'function') {
						handler.call();
					} else if (typeof handler == 'string') {
						window[handler]();
					}
					me.hide();
				}
			});
			btn.addClass(btnClasses);
			btn.appendTo(MessageBox.find('.message-buttons'));
		});
	} else {
		var btn = $('<a/>', {
			href: "javascript:void(0)",
			class: "it-btn",
			html: "OK",
			click: function () {
				me.hide();
			}
		});
		btn.appendTo(MessageBox.find('.message-buttons'));
	}

	this.show = function () {
		MessageBox.show();
	}

	this.hide = function () {
		MessageBox.remove();
	}

	this.getSetting = function () {
		return settings;
	}

	this.getId = function () {
		return id;
	}

	MessageBox.appendTo('body');
	setTimeout(() => this.show(), 100);

	return this;
}

function ComboBox(params) {
	var settings = $.extend({
		dataIndex: '',
		value: '',
		emptyText: '',
		autoLoad: true,
		allowBlank: true,
		disabled: false,
		readonly: false,
		width: '',
		dataSource: {
			type: 'array',
			url: '',
			data: [],
		},
	}, params);

	var id = settings.dataIndex ? settings.dataIndex : makeid();
	var parent = null;

	var template = $('<select/>', {
		class: "it-form-control",
		name: settings.dataIndex,
		id: settings.dataIndex
	});

	if (settings.width)
		template.width(settings.width);

	if (settings.readOnly)
		template.prop('readonly', settings.readOnly);

	if (settings.disabled)
		template.prop('disabled', settings.disabled);

	if (!settings.allowBlank)
		template.prop('required', true);

	template.blur((e) => {
		var valid = e.target.checkValidity();
		template[!valid ? "addClass" : "removeClass"]('invalid');
	});

	this.events = new Event(this, settings);
	this.events.add("hide", () => template.hide());
	this.events.add("show", () => template.show());
	this.events.set(template);

	this.onLoad = (act) => this.events.add("onLoad", act);
	this.getId = function () {
		return settings.dataIndex;
	}

	this.getDom = function () {
		return template;
	}

	this.getSelected = function () {
		return template.find('option:selected');
	}

	this.val = function (v) {
		if (typeof v != "undefined") {
			template.find('option').filter('[value="' + v + '"]').prop("selected", true);
		} else {
			return template.find('option:selected').val();
		}
	}

	this.getDataSource = function () {
		template.empty();

		if (settings.emptyText) {
			template.append($('<option/>', {
				val: '',
				text: settings.emptyText
			}));
		}

		switch (settings.dataSource.type) {
			case 'array':
				var data = typeof settings.dataSource.data !== "undefined" ? settings.dataSource.data : null;
				if (data) {
					$.each(data, (k, val) => {
						var extraData = typeof val.data !== "undefined" ? val.data : null;
						template.append($('<option/>', {
							val: val.key,
							text: val.value,
							selected: (val.key == settings.value),
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
					success: (data) => {
						var rows = typeof data.rows !== "undefined" ? data.rows : null;
						if (rows && rows.length) {
							$.each(rows, (k, val) => {
								var extraData = typeof val.data !== "undefined" ? val.data : null;
								template.append($('<option/>', {
									val: val.key,
									text: val.value,
									selected: (val.key == settings.value),
									data: extraData
								}));
							});
						}
						this.events.fire("onLoad", [template, rows]);
					}
				});
				break;

			default:
				throw "type only available for ajax and array";
				break;
		}
	}

	this.getSettings = function () {
		return settings;
	}

	this.setEnabled = function (enable) {
		select.prop('disabled', !enable);
	}

	this.setDataSource = function (data) {
		settings.dataSource = data;
		me.getDataSource();
	}

	this.renderTo = function (obj) {
		template.appendTo(obj);
		parent = obj;
	}

	if (settings.autoLoad) {
		this.getDataSource();
	}

	return this;
}

function HTML(params) {
	var settings = $.extend({
		content: '',
		url: '',
		id: '',
		class: '',
		css: {}
	}, params);

	var me = this;
	var id = settings.id == '' ? makeid() : settings.id;
	var parent = null;
	var content = $('<div/>', {
		id: id,
		css: settings.css,
		class: settings.class
	});

	if (empty(settings.url)) {
		if (typeof settings.content === 'string') {
			content.html(settings.content);
		} else {
			var htmlKonten = typeof settings.content === 'object' ? settings.content : $(settings.content);
			htmlKonten.appendTo(content);
		}
	} else {
		content.load(settings.url);
	}

	me.setContent = function (html) {
		content.html(html);
	}

	me.renderTo = function (obj) {
		content.appendTo(obj);
		parent = obj;
	}

	me.getSetting = function () {
		return settings;
	}

	me.getId = function () {
		return id;
	}

	return me;
}

function Form(params) {
	var settings = $.extend({
		method: 'POST',
		id: 'Fm',
		url: '',
		width: '100%',
		css: {},
		fieldDefaults: {
			labelWidth: 100,
			fieldType: 'text',
			fieldBlock: false,
		},
		items: []
	}, params);

	var me = this;
	var parent = null;
	var $konten = $('<form/>', {
		method: settings.method,
		action: settings.url,
		name: settings.id,
		id: settings.id,
		enctype: 'multipart/form-data',
		css: settings.css
	});
	$konten.on('keyup keypress', function (e) {
		var keyCode = e.keyCode || e.which;
		if (keyCode === 13) {
			e.preventDefault();
			return false;
		}
	});

	var submit = $('<input/>', {
		type: 'submit',
		css: {
			'display': 'none'
		}
	}).appendTo($konten);

	var nItems = {};
	if (settings.items.length > 0) {
		var $itemsContainer = $('<table/>', {
			class: 'it-table-form',
			width: settings.width,
		});

		if (settings.fieldDefaults.fieldBlock)
			$itemsContainer.addClass('form-block');

		for (var i = 0; i < settings.items.length; i++) {
			if (settings.items[i] === null) continue;
			var items = settings.items;
			var item = null;
			var tr =
				`<tr>
					<td width="${settings.fieldDefaults.labelWidth}">${items[i].fieldLabel}</td>
					<td class="form-field ${getStyle(settings.items[i])}"></td>
				</tr>`;

			if (settings.fieldDefaults.fieldBlock) {
				var tr =
					`<tr><td class="form-label">${items[i].fieldLabel}</td></tr>
					 <tr class="form-block-space"><td class="form-field ${getStyle(settings.items[i])}"></td></tr>`;
			}

			$tr = $(tr);
			if (typeof items[i].renderTo === 'function') {
				items[i].renderTo($tr.find('.form-field'));
				item = items[i];
				nItems[item.getId()] = item;
			} else if (typeof items[i] === 'object') {
				item = createObject(items[i]);
				item.renderTo($tr.find('.form-field'));
				nItems[item.getId()] = item;
			}

			$tr.appendTo($itemsContainer);
		}

		$itemsContainer.appendTo($konten);
	}

	me.setData = function (data) {
		$.each(data, function (key, value) {
			if ($konten.find("#" + key).attr("type") != "file") {
				$konten.find("#" + key).val(value);
				$konten.find("#" + key).find("option").filter('[value="' + value + '"]').prop("selected", true);
				$konten.find("#" + key).prop("checked", (value == 1 ? true : false));
			}
		});
	}

	// Deprecated
	me.validasi = function (msg) {
		console.warn(".validasi() is deprecated, for the future please use .validate()");
		var msg = typeof msg == 'undefined' ? true : msg;
		var valid = true;
		$.each(nItems, function (i, item) {
			var allowBlank = typeof item.getSetting().allowBlank != "undefined" ? item.getSetting().allowBlank : true;
			var minlength = typeof item.getSetting().minlength != "undefined" ? item.getSetting().minlength : 0;
			var id = item.getId();
			var obj = $("#" + id);
			var val = typeof obj.find("option:selected").val() != 'undefined' ? obj.find("option:selected").val() : obj.val();

			if (val == null) val = '';

			obj.removeClass("invalid");

			if (!allowBlank && val == "") {
				obj.addClass("invalid");
				valid = false;
			}
			if (val != "" && val.length < minlength) {
				obj.addClass("invalid");
				valid = false;
			}
		});

		if (valid == false && msg) {
			new MessageBox({
				type: 'critical',
				width: '400',
				title: 'Peringatan',
				message: "Silahkan Lengkapi Kolom Berwarna Merah"
			});
		}

		return valid;
	}

	me.getItem = function (idx) {
		return nItems[idx];
	}

	me.serializeObject = function () {
		console.warn(".serializeObject() is deprecated, for the future please use .serializeJSON()");
		return $konten.serializeJSON();
	}

	this.serializeJSON = function () {
		return $konten.serializeJSON();
	}

	this.serialize = function () {
		return $konten.serialize();
	}

	this.validate = function () {
		var valid = false;
		$konten.removeAttr('novalidate');
		$konten.find('.it-form-control').blur();
		$konten.find(':submit').click((e) => {
			valid = $konten[0].checkValidity();
			if (valid) {
				e.preventDefault();
			}
		});
		$konten.find(':submit').click();
		return valid;
	}

	this.renderTo = function (obj) {
		$konten.appendTo(obj);
		parent = obj;
	}

	this.reset = function () {
		$konten[0].reset();
	}

	this.getSetting = function () {
		return settings;
	}

	this.getId = function () {
		return id;
	}

	return me;
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
		if (settings.type == 'numeric') {
			input.keypress(function (e) {
				if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
					return false;
				}
			});
		}
	}

	input.attr({
		name: settings.dataIndex,
		id: settings.dataIndex,
		class: 'it-form-control'
	});

	if (settings.placeholder)
		input.attr('placeholder', settings.placeholder);

	if (settings.defaultValue)
		input.val(settings.defaultValue);

	if (settings.disabled)
		input.prop('disabled', settings.disabled);

	if (settings.readOnly)
		input.prop('readonly', settings.readOnly);

	if (!settings.allowBlank)
		input.prop('required', true);

	if (!$.isEmptyObject(settings.css))
		input.css(settings.css)

	input.blur((e) => {
		var valid = e.target.checkValidity();
		input[!valid ? "addClass" : "removeClass"]('invalid');
	});

	$konten = input;
	$.extend(this, this.events.set($konten));

	this.val = function (v) {
		if (typeof v == undefined) {
			return $konten.val() || "";
		} else {
			$konten.val(v);
		}
	}

	this.renderTo = function (obj) {
		$konten.appendTo(obj);
		parent = obj;
	}

	this.getSetting = function () {
		return settings;
	}

	this.getId = function () {
		return settings.dataIndex;
	}

	this.setDisabled = function (disabled = false) {
		input.prop('disabled', disabled);
	}

	this.setReadOnly = function (readonly = false) {
		input.prop('disabled', readonly);
	}

	return this;
}

function CheckBox(params) {
	var settings = $.extend({
		dataIndex: 'textfield',
		text: '',
		disabled: false,
		newLine: false,
		value: '1'
	}, params);

	var me = this;
	var parent = null;
	disabled = settings.disabled > 0 ? ' disabled ' : '';

	var konten = '<input type="checkbox" class="it-checkbox" name="' + settings.dataIndex + '" id="' + settings.dataIndex + '" value="' + settings.value + '" ' + maxlength + minlength + disabled + getStyle(settings) + '><label class="it-label" for="' + settings.dataIndex + '">' + settings.text + '</label>' + (settings.newLine ? '<BR>' : '');
	var $konten = $(konten);

	me.renderTo = function (obj) {
		$konten.appendTo(obj);
		parent = obj;
	}

	me.getSetting = function () {
		return settings;
	}
	me.getId = function () {
		return settings.dataIndex;
	}
	return me;
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
		items: [],
	}, params);

	var me = this;
	var parent = null;
	var id = makeid();
	var items = settings.items;

	me.content = $('<div />', {
		id: id,
		class: 'it-flex'
	});
	me.content.css(settings.css);
	me.content.addClass('it-flex-dir dir-' + settings.direction);
	me.content.addClass('it-flex-wrap wrap-' + settings.wrap);
	me.content.addClass('it-flex-jc jc-' + settings.justifyContent);
	me.content.addClass('it-flex-ai ai-' + settings.alignItems);
	me.content.addClass('it-flex-ac ac-' + settings.alignContent);

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

	$.each(settings.items, (k, val) => {
		var item = null;
		if (typeof val.renderTo === 'function') {
			val.renderTo(me.content);
		} else if (typeof val === 'object') {
			item = createObject(val);
			if (item) {
				item.renderTo(me.content);
			}
		}
	});

	me.renderTo = function (obj) {
		this.content.appendTo(obj);
		parent = obj;
	}

	me.getSetting = function () {
		return settings;
	}
	me.getId = function () {
		return id;
	}
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