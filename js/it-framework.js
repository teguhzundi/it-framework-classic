//**************** JSON.stringify : to convert JSON into string ************//
var base_url = base_url || '';
var base_events = ["blur", "change", "click", "dblclick", "focus", "hover", "keydown", "keypress", "keyup", "show", "hide"];

//**************** String.format : to create formatted string ************//
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

function getStyle(obj) {
	var style = "";
	if (typeof obj.style != 'undefined') {
		$.each(obj.style, function (key, value) {
			style += key + ":" + value + ";";
		});

		style = style != "" ? " style='" + style + "' " : "";
	}

	return style;
}

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
	}
	return res;
}

function Event(parent, s) {
	var settings = s || {};
	var me = this;
	me.events = {};
	me.add = function (e, f) {
		if (typeof f == 'function') {
			me.events[e] = f;
		}
	}

	me.fire = function (events, arg, ret) {
		var ret = ret || parent;
		if (me.events.hasOwnProperty(events) && typeof me.events[events] == 'function')
			me.events[events].apply(ret, arg);
		if (settings.hasOwnProperty(events) && typeof settings[events] == 'function')
			settings[events].apply(ret, arg);
	}

	me.set = function (b) {
		var ret = {};
		$.each(base_events, function (index, value) {
			var value = value;
			var on = "on" + value.substring(0, 1).toUpperCase() + value.substring(1, value.length).toLowerCase();

			ret[value] = function () {
				b.trigger(value);
			}
			ret[on] = function (act) {
				me.add(on, act);
			}
			b.on(value, function () {
				me.fire(value, [], this);
				me.fire(on, []);
			});
		});

		return ret;
	}
}

function DataTable(options) {
	var settings = $.extend({
		id: '',
		width: '',
		height: '',
		cellEditing: true,
		multipleSelected: false,
		wrap: false,
		store: {
			type: 'json',
			params: {
				start: 0,
				limit: 20,
			}
		},
		css: {},
		columns: [],
		autoLoad: false,
	}, options);

	var me = this;
	var parent = null;
	var id = settings.id == "" ? makeid() : settings.id;
	var lastRow = null;

	var DataTable = $(`
		<div class="it-grid">
			<div class="it-grid-container">
				<div class="it-grid-wrapper">
					<table border="1" width="100%">
						<thead></thead>
						<tbody></tbody>
					</table>
				</div>
				<nav class="it-grid-pagination">
					<ul>
						<li> <a href="javascript:void(0)" rel="first"> FIRST </a> </li>
						<li> <a href="javascript:void(0)" rel="back"> <i class="fa fa-chevron-left"></i> </a> </li>
						<li>
							<input type="text" class="pagination-current" value="1"> 
							<span id="pagination-page-count"></span>
						</li>
						<li> <a href="javascript:void(0)" rel="next"> <i class="fa fa-chevron-right"></i> </a> </li>
						<li> <a href="javascript:void(0)" rel="last"> LAST </a> </li>
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

	if (settings.width)
		DataTable.width(settings.width);

	if (settings.height)
		DataTable.height(settings.height);

	if (!$.isEmptyObject(settings.css))
		DataTable.css(settings.css);

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

	/*
	me.showError = function (err) {
		var arError = [];
		for (var er = 0; er < err.length; er++) {
			DataTable.find("tbody tr:eq(" + err[er].indexRow + ")").css("background", "#ffcece");
			arError.push(err[er].indexRow);
		}

		for (var dc = 0; dc < me.store.dataChanged.length; dc++) {
			if (arError.indexOf(me.store.dataChanged[dc].indexRow.toString()) == -1) {
				DataTable.find("tbody tr:eq(" + me.store.dataChanged[dc].indexRow + ")").find("td").removeClass("it-grid-changed");
				me.store.dataChanged.slice(dc);
			}
		}
	}
	*/

	this.load = (opt = {}) => {
		if (me.data) {
			// Empty table body
			DataTable.find("tbody").empty();

			var totalRows = me.data.total_rows;
			var start = me.params.start;
			var limit = me.params.limit;
			var lastData = (start + limit);
			var jmlData = me.data.rows.length;

			lastRow = null;
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
							}).height(td.height()-1);
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
		var tr = $('<tr/>').appendTo(DataTable.find("tbody"));
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
				if(dataHelper) {
					$.each(dataHelper, function(k, data) {
						if(data.key == value) {
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
			}).data(col);

			td.click((e) => {
				if (!this.hasTdError) {
					DataTable.find('tbody tr').removeClass('it-grid-selected');
					tr.addClass('it-grid-selected');
					this.selectedRecord = td.parent('tr').index();
					this.selectedColumn = td.index();
					var editor = typeof col.editor !== "undefined" ? col.editor : null;
					var locked = typeof this.store.storeData.rows[this.selectedRecord].locked !== "undefined" ? this.store.storeData.rows[this.selectedColumn].locked : false;

					if (editor && !locked)
						this.setEditable(td);
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
				row = $.extend({}, row, { new: true });
				this.store.storeData.rows.push(row);
				this.createRows(row);
				DataTable.find('tbody tr:last-child td:first-child').click();
			}, 100);
		}
	}

	this.removeRow = function(row) {
		var deleted = this.data.rows.splice(row, 1);
		DataTable.find(`tbody > tr:eq(${row})`).fadeOut(100, function() {
			$(this).remove();
		});
	};

	this.setPage = (act) => {
		if (this.data) {
			lastPage = Math.ceil(this.data.total_rows / this.params.limit);
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
					css: { width: v.width }
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

	return this;
}

// Deprecated
function Grid(options) {
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

	var me = this;
	var parent = null;
	var id = makeid();
	var items = settings.items;
	var nItems = {};

	var konten = `
		<nav id="${id}" class="it-toolbar ` + (settings.position == 'bottom' ? 'bottom' : '') + `">
			<ul class="it-toolbar-kiri left"></ul>
			<ul class="it-toolbar-kanan right"></ul>
		</nav>`;

	var $konten = $(konten);
	for (var i = 0; i < items.length; i++) {
		if (items[i] === null) continue;
		var align = 'kiri';
		var item = null;
		var li = $('<li/>');

		if (typeof items[i].renderTo == 'function') {
			item = items[i];
		} else if (typeof items[i] == 'object') {
			item = createObject(items[i]);
		}
		nItems[item.getId()] = item;

		item.renderTo(li);
		align = typeof item.getSetting().align != 'undefined' ? item.getSetting().align : align;
		$konten.find('.it-toolbar-' + align).append(li);
	}

	me.renderTo = function (obj) {
		$konten.appendTo(obj);
		parent = obj;
	}

	me.text = " ";
	me.debug = function (o) {
		return nItems[o.trim()];
	}

	me.getItem = function (o) {
		return nItems[o];
	}
	me.getSetting = function () {
		return settings;
	}
	me.getId = function () {
		return id;
	}
	return me;
}

function Button(params) {
	var settings = $.extend({
		iconCls: '',
		btnCls: '',
		css: {},
		disabled: false,
		text: 'Button',
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
	var defaults = {
		width: 300,
		height: 300,
		type: '',
		items: [],
		padding: 5,
		modal: true,
		clear: false,
		title: '',
		iconCls: '',
		autoShow: true,
	};

	var me = this;
	var id = makeid();
	var settings = $.extend(defaults, params);
	var icon = settings.iconCls != '' ? '<span class="fa fa-' + settings.iconCls + '"></span>' : '';
	var $dialog = $(`
		<div class="it-dialog ${getStyle(settings)} ${settings.type}">
			<div class="it-dialog-effect">
				<div class="it-title">${icon} ${settings.title}</div> 
			</div>
		</div>
	`);
	var $modal = $('<div/>', {
		class: 'it-modal it-hide',
		id: 'it-modal-dialog'
	});

	var curZ = $(".it-dialog").last().css("z-index") + 1;
	var diaZ = curZ + 1;
	if (curZ > 1) $modal.css("z-index", curZ);
	if (diaZ > 2) $dialog.css("z-index", diaZ);

	me.events = new Event(me, settings);
	me.afterShow = function (act) {
		me.events.add("afterShow", act);
	}
	me.onClose = function (act) {
		me.events.add("onClose", act);
	}
	me.onHide = function (act) {
		me.events.add("onHide", act);
	}

	if (settings.modal)
		$modal.show();

	$dialog.width(settings.width);

	if (settings.type != 'fluid') {
		$dialog
			.find('.it-dialog-effect')
			.height(settings.height)
			.draggable({
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
	}

	var items = settings.items;
	var item = null;
	var nItems = [];
	for (var i = 0; i < items.length; i++) {
		if (items[i] === null) continue;
		if (typeof items[i].renderTo == 'function') {
			items[i].renderTo($dialog.find(".it-dialog-effect"));
			nItems[i] = items[i];
		} else if (typeof items[i] == 'object' && items[i].xtype == 'ajax') {
			$.ajax({
				url: items[i].url,
				success: function (data) {
					var $dialogKonten = $('<div class="dialog-konten"></div>');
					$dialogKonten.css({
						'padding': settings.padding
					});
					$dialogKonten.append(data);

					$dialog.find(".it-dialog-effect").append($dialogKonten);
				}
			});
		} else if (typeof items[i] == 'object') {
			item = createObject(items[i]);
			item.renderTo($dialog.find(".it-dialog-effect"));
			nItems[i] = item;
		}
	}

	me.getItem = function (idx) {
		return nItems[idx];
	}
	me.getSetting = function () {
		return settings;
	}
	me.getId = function () {
		return id;
	}

	me.hide = function () {
		$dialog.removeClass('it-dialog-s');
		$modal.hide();

		me.events.fire("onHide", []);
	}

	me.show = function () {
		$dialog.addClass('it-dialog-s');
		$modal.show();

		me.events.fire("afterShow", []);
	}

	me.destroy = function () {
		$dialog.remove();
		$modal.remove();
		me = null;
	}

	me.close = function () {
		me.hide();
		setTimeout(function () {
			$dialog.remove();
			$modal.remove();
			me.events.fire("onClose", []);
			me = null;
		}, 600);
	}

	$('body').append($modal);
	$('body').append($dialog);

	setTimeout(function () {
		me.show();
	}, 200);

	return me;
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
	var defaults = {
		type: 'info',
		title: 'Judul',
		message: '',
		width: 450,
		height: 50,
		padding: 10,
		buttons: [],
		btnAlign: 'kanan'
	};

	var me = this;
	var settings = $.extend(defaults, params);
	var btn = "";
	var markup = [];
	var buttons = settings.buttons;
	var btn = null;
	var btnCls = '';

	icon = '<img src="' + base_url + 'resources/framework/css/images/i-' + settings.type + '.png" style="margin:10px 10px 0; float:left;">';
	markup = [
		'<div class="it-modal" id="it-modalConfirm"></div>',
		'<div class="it-messagebox" ' + getStyle(settings) + '>',
		'<div class="it-messagebox-effect">',
		'<div class="it-title">' + settings.title + '</div>',
		'<table width="100%"><tr><td width="80">' + icon + '</td><td><p style="position:static;">' + settings.message + '</p></tr>',
		'<tr><td colspan="2"><div id="it-confirmBtn" class="' + settings.btnAlign + '"></div></td></tr></table>',
		'</div>',
		'</div>'
	].join('');
	$markup = $(markup);

	if (buttons.length == 0) {
		btn = $('<a href="javascript:void(0)" class="it-btn">Ok</a>');
		btn.click(function () {
			me.hide();
		});
		btn.appendTo($markup.eq(1).find('#it-confirmBtn'));
	} else {
		for (var i = 0; i < buttons.length; i++) {
			var $id = makeid();
			var btnCls = typeof buttons[i].btnCls == 'undefined' ? '' : ' ' + buttons[i].btnCls;
			var btn = $('<a id="' + $id + '" href="javascript:void(0)" class="it-btn' + btnCls + '">' + buttons[i].text + '</a>');

			btn.appendTo($markup.eq(1).find('#it-confirmBtn'));

			$markup.eq(1).find('#it-confirmBtn').find('#' + $id).click(function () {
				var $bx = $(this).parent().find("a").index(this);
				var handler = typeof buttons[$bx].handler != 'undefined' ? buttons[$bx].handler : null;

				$('.it-messagebox').removeClass('it-messagebox-s');
				$('#it-modalConfirm').hide();
				setTimeout(function () {
					$('.it-messagebox').remove();
					$('#it-modalConfirm').remove();

					if (typeof handler == 'function') {
						handler.call();
					} else if (typeof handler == 'string') {
						window[handler]();
					}
				}, 250);
			});
		}
	}

	$markup.appendTo('body');

	var ConfirmBox = $('.it-messagebox');
	ConfirmBox.css('min-height', settings.height);
	ConfirmBox.find('p').css('padding', settings.padding);
	ConfirmBox.width(settings.width);
	ConfirmBox.find('.it-messagebox-effect').draggable({
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
	me.show = function () {
		try {
			$('input,select,textarea').blur();
		} catch (e) {}
		$('.it-messagebox').addClass('it-messagebox-s');
		$('#it-modalConfirm').show();
	}
	me.hide = function () {
		$('.it-messagebox').removeClass('it-messagebox-s');
		$('#it-modalConfirm').hide();
		setTimeout(function () {
			$('.it-messagebox').remove();
			$('#it-modalConfirm').remove();
		}, 250);
	}

	me.getSetting = function () {
		return settings;
	}
	me.getId = function () {
		return id;
	}
	setTimeout(function () {
		me.show();
	}, 100);

	return me;
}

function ComboBox(params) {
	var settings = $.extend({
		dataIndex: 'combo',
		value: 'Button',
		emptyText: '',
		format: null,
		defaultValue: '',
		autoLoad: true,
		allowBlank: true,
		disabled: false,
		width: '',
		temp: false,
		styled: {
			active: false,
			search: false,
			showKey: false,
			optionWidth: 0,
			optionHeight: 0
		},
		datasource: {
			type: 'array',
			data: null,
			url: '',
		}
	}, params);

	var me = this;
	var parent = null;
	var word = null;
	var datatemp = null;

	me.events = new Event(me, settings);

	me.onLoad = function (act) {
		me.events.add("onLoad", act);
	}
	me.onComplete = function (act) {
		me.events.add("onComplete", act);
	}

	var disabled = settings.disabled == true ? "disabled" : "";
	var $width = settings.width != '' ? 'style="width:' + settings.width + 'px;"' : '';
	var konten = '<div class="it-combobox-wrap"><select ' + $width + ' name="' + settings.dataIndex + '" id="' + settings.dataIndex + '" ' + getStyle(settings) + disabled + ' class="it-combobox"></select></div>';
	var $konten = $(konten);

	if (settings.styled.active) {
		$konten.find("select").css("visibility", "hidden");
		$konten.append("<div class='it-combobox-styled'/>");
		$konten.append("<ol class='it-combobox-options'/>");

		if (settings.styled.search) {
			$konten.append("<input type='text' class='word'>");
			$konten.find("ol.it-combobox-options").css("top", "55px");
		}
		if (settings.styled.optionWidth > 0) $konten.find("ol").css("min-width", settings.styled.optionWidth);
		if (settings.styled.optionHeight > 0) $konten.find("ol").css("max-height", settings.styled.optionHeight);
		if (typeof settings.align != "undefined" && settings.align == "kanan") $konten.find("ol").css("right", 0);
	}


	me.getDataSource = function (params) {
		$konten.find("select").html('');

		if (settings.emptyText) $konten.find("select").append("<option value=''>" + settings.emptyText);
		if (settings.temp && datatemp != null) {
			settings.datasource.type = 'array';
			settings.datasource.data = datatemp;
		}
		var $value;
		var $sel;
		settings.datasource.params = params || settings.datasource.params;
		if (settings.datasource.type == 'array') {
			var row = settings.datasource.data;
			if (row != null) {
				for (var i = 0; i < row.length; i++) {
					$value = settings.format != null ? settings.format.format(row[i].key, row[i].value) : row[i].value;
					$sel = row[i].key == settings.defaultValue ? "selected" : "";
					dataParams = typeof row[i].params != 'undefined' ? JSON.stringify(row[i].params) : '';
					$konten.find("select").append("<option value='" + row[i].key + "' " + $sel + " data-params='" + dataParams + "'>" + $value);
				}
				if (typeof row != 'undefined' && row.length && row.length == 1) {
					$konten.find("option[value='']").remove();
					$konten.val(row[0].key);
					$konten.trigger('change');
				}
				setTimeout(function () {
					me.events.fire("onLoad", [row]);
					me.events.fire("onComplete", [row]);
				}, 1);
			}
		} else if (settings.datasource.type == 'ajax') {
			$.ajax({
				url: settings.datasource.url,
				type: settings.datasource.method || "POST",
				data: settings.datasource.params || {},
				dataType: 'json',
				success: function (data) {
					var row = data.rows;
					datatemp = row;
					if (typeof row != 'undefined' && row.length) {
						for (var i = 0; i < row.length; i++) {
							$value = settings.format != null ? settings.format.format(row[i].key, row[i].value) : row[i].value;
							$sel = row[i].key == settings.defaultValue ? "selected" : "";
							$konten.find("select").append("<option value='" + row[i].key + "' " + $sel + " data-params='" + (typeof row[i].params != 'undefined' ? JSON.stringify(row[i].params) : '') + "'>" + $value);
						}
					}

					if (settings.datasource.callback) {
						settings.datasource.callback.call($konten, settings);
					} else {
						if (typeof row != 'undefined' && row.length && row.length == 1) {
							$konten.find("option[value='']").remove();
							$konten.val(row[0].key);
							$konten.trigger('change');
						}
					}
					me.events.fire("onLoad", [row]);
					me.events.fire("onComplete", [row]);
				}
			});
		}
	}
	me.onComplete(function () {
		if (settings.styled.active) {
			$this = $konten.find("select");
			var numberOfOptions = $this.children('option').length;
			var $val = $this.find('option:selected').val() != "" && settings.styled.showKey ? $this.find('option:selected').val() : $this.find('option:selected').text();
			$konten.find("div.it-combobox-styled").text($val);

			$konten.find("ol.it-combobox-options").html("");
			for (var i = 0; i < numberOfOptions; i++) {
				$('<li/>', {
					html: (settings.styled.showKey ? "<span>" + $this.children('option').eq(i).val() + "</span>" : "") + $this.children('option').eq(i).text(),
					rel: $this.children('option').eq(i).val()
				}).appendTo($konten.find("ol"));
			}

			$konten.find("div.it-combobox-styled").click(function (e) {
				e.stopPropagation();

				$('div.it-combobox-styled.active').each(function () {
					$(this).removeClass('active').next('ol.it-combobox-options').hide();
				});
				$(this).toggleClass('active').next('ol.it-combobox-options').toggle();
				$konten.find("input").show();
			});

			$konten.find("li").click(function (e) {
				e.stopPropagation();

				var $vv = $(this).attr('rel') != "" && settings.styled.showKey ? $(this).attr('rel') : $(this).text();
				$konten.find("div.it-combobox-styled").text($vv).removeClass('active');
				$this.val($(this).attr('rel'));
				$konten.find("ol.it-combobox-options").hide();
				$konten.find("input").hide();
			});

			$(document).click(function () {
				$konten.find("div.it-combobox-styled").removeClass('active');
				$konten.find("ol.it-combobox-options").hide();
				$konten.find("input").hide();
			});

			$konten.find("input").click(function (e) {
				e.stopPropagation();

				$konten.find("ol.it-combobox-options").show();
			});

			var timer;
			$konten.find("input").keyup(function (e) {
				e.stopPropagation();
				var cWord = $(this).val();
				timer && clearTimeout(timer);
				setTimeout(function () {
					if (word != cWord) {
						$('.loading').addClass('dont-show');

						me.getDataSource($.extend(settings.datasource.params, {
							word: cWord
						}));
						word = cWord;
					}
				}, 600);
			});
		}
	});

	if (settings.emptyText) $konten.find("select").append("<option value=''>" + settings.emptyText);
	if (settings.autoLoad) {
		me.getDataSource();
	}

	me.events.add("hide", function () {
		$konten.hide();
	});
	me.events.add("show", function () {
		$konten.show();
	});
	me.events.add("blur", function () {
		var val = typeof me.val() != 'undefined' ? me.val() : '';
		var invalid = false;

		if (!settings.allowBlank && empty(val)) invalid = true;
		if (val.length < settings.minlength && !empty(val)) invalid = true;

		if (invalid) $(this).addClass("invalid");
		else $(this).removeClass("invalid");

		if (settings.styled.active) {
			if (invalid) $konten.find("div.it-combobox-styled").addClass("invalid");
			else $konten.find("div.it-combobox-styled").removeClass("invalid");
		}
	});

	me.val = function (v) {
		if (typeof v != "undefined") {
			$konten.find('option').filter('[value="' + v + '"]').prop("selected", true);

			if (settings.styled.active) {
				$this = $konten.find("select");
				var $val = !empty($this.find('option:selected').val()) && settings.styled.showKey ? $this.find('option:selected').val() : $this.find('option:selected').text();
				$konten.find("div.it-combobox-styled").text($val);
			}
		} else {
			return $konten.find('option:selected').val();
		}
	}

	me.params = function () {
		return $konten.find('option:selected').data("params");
	}

	me.disable = function (dis) {
		$konten.find("select").attr("disabled", (dis == null || dis));
	}
	me.getDOM = function () {
		return $konten;
	}

	$.extend(me, me.events.set($konten.find("select")));

	me.renderTo = function (obj) {
		if (typeof settings.infoHolder == 'object') {
			$wrap = $('<div class=\"it-infoBox\"/>');
			$konten = $wrap.append($konten);

			var infoText = typeof settings.infoHolder.text != 'undefined' ? settings.infoHolder.text : '';
			infoText = typeof settings.infoHolder.icon != 'undefined' ? '<span class="fa fa-' + settings.infoHolder.icon + '"></span>' : infoText;
			$konten.prepend('<div class=\"keterangan ' + settings.infoHolder.position + '\"> ' + infoText + ' </div>');
		}

		$konten.appendTo(obj);
		parent = obj;
	}

	me.setDataSource = function (datasource) {
		$.extend(settings.datasource, datasource);
		me.getDataSource();
	}
	me.getSetting = function () {
		return settings;
	}
	me.getId = function () {
		return settings.dataIndex;
	}
	return me;
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
	me.setInvalid = function (data) {
		$.each(data, function (key, value) {
			$konten.find("#" + key).wrap('<div class=\"it-infoBox\"/>');
			$konten.find("#" + key).parent().append('<div class=\"it-infoBox-message\"> ' + value + ' </div>');
			$konten.find("#" + key).parent().find(".it-infoBox-message").css('left', $konten.find("#" + key).outerWidth() + 10);
			$konten.find("#" + key).addClass('invalid');
		});
	}

	me.validasi = function (msg) {
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
		return $konten.serializeJSON();
	}

	me.renderTo = function (obj) {
		$konten.appendTo(obj);
		parent = obj;
	}

	me.clear = function () {
		$.each($konten.serializeObject(), function (key, value) {
			if ($konten.find("#" + key).attr("type") != "file") {
				$konten.find("#" + key).val("");
				//$konten.find("#" + key).find("option").filter('[value="' + value + '"]').prop("selected", true);
				//$konten.find("#" + key).prop("checked", (value == 1 ? true : false));
			}
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

function TextBox(params) {
	var settings = $.extend({
		dataIndex: 'textfield',
		type: 'text',
		size: 20,
		maxlength: 0,
		minlength: 0,
		rows: 50,
		cols: 3,
		format: '',
		disabled: false,
		readOnly: false,
		allowBlank: true,
		autoComplete: null,
		searchButton: false,
		defaultValue: '',
		css: {}
	}, params);

	var me = this;
	var parent = null;
	me.events = new Event(me, settings);
	maxlength = settings.maxlength > 0 ? ' maxlength="' + settings.maxlength + '" ' : '';
	minlength = settings.minlength > 0 ? ' minlength="' + settings.minlength + '" ' : '';
	disabled = settings.disabled > 0 ? ' disabled ' : '';
	readOnly = settings.readOnly > 0 ? ' readonly ' : '';
	value = settings.defaultValue != '' ? ' value="' + settings.defaultValue + '" ' : '';

	if (settings.type == 'password') {
		var konten = '<input class="it-textbox" type="password" size="' + settings.size + '" name="' + settings.dataIndex + '" id="' + settings.dataIndex + '"' + maxlength + minlength + disabled + readOnly + value + getStyle(settings) + '>';
	} else if (settings.type == 'date') {
		var konten = '<input class="it-textbox" type="text" size="' + settings.size + '" name="' + settings.dataIndex + '" id="' + settings.dataIndex + '"' + maxlength + minlength + disabled + readOnly + value + getStyle(settings) + '>';
	} else if (settings.type == 'numeric') {
		var konten = '<input class="it-textbox" type="text" size="' + settings.size + '" name="' + settings.dataIndex + '" id="' + settings.dataIndex + '"' + maxlength + minlength + disabled + readOnly + value + getStyle(settings) + '>';
	} else if (settings.type == 'textarea') {
		value = settings.defaultValue;
		var konten = '<textarea class="it-textbox" rows="' + settings.rows + '" cols="' + settings.cols + '" name="' + settings.dataIndex + '" id="' + settings.dataIndex + '"' + maxlength + minlength + disabled + readOnly + getStyle(settings) + '>' + value + '</textarea>';
	} else {
		var konten = '<input class="it-textbox" type="' + settings.type + '" size="' + settings.size + '" name="' + settings.dataIndex + '" id="' + settings.dataIndex + '"' + maxlength + minlength + disabled + readOnly + value + getStyle(settings) + ' >';
	}

	var $konten = $(konten);
	$konten.css(settings.css);

	if (settings.autoComplete != null) {
		$konten.autocomplete(settings.autoComplete);
	}

	me.autoComplete = function (set) {
		$konten.autocomplete(set);
	}

	$konten.blur(function () {
		$(this).removeClass("invalid");
		if (!settings.allowBlank && $(this).val() == "") $(this).addClass("invalid");
		if ($(this).val().length < settings.minlength && $(this).val() != "") $(this).addClass("invalid");
	});

	$.extend(me, me.events.set($konten));

	if (settings.format != '') {
		if (typeof settings.format.money != 'undefined') {
			$konten.maskMoney({
				allowNegative: true,
				thousands: '.',
				decimal: ',',
				defaultZero: false,
				precision: 0,
				browser: {
					mozilla: true,
					msie: false
				}
			});
		} else {
			$konten.mask(settings.format);
		}
	}
	if (settings.type == 'date') {
		var today = new Date();
		$konten.datepicker({
			dateFormat: settings.dateformat || 'dd-mm-yy',
			changeMonth: true,
			changeYear: true,
			yearRange: (today.getFullYear() - 60) + ":" + today.getFullYear(),
			onSelect: function (a, b) {
				$(this).focus();
			}
		});
	}
	if (settings.type == 'numeric') {
		var tmpAngka = "";
		$konten.keyup(function (e) {
			if ($.isNumeric($(this).val()) == false && !empty($(this).val())) {
				$(this).val(tmpAngka);
			} else {
				tmpAngka = $(this).val();
			}
		});
	}

	if (settings.type == 'mask') {
		$konten.change(function (e) {
			if ($(this).val().match(settings.mask) == null) {
				$(this).val("");
				new MessageBox({
					type: 'critical',
					width: '400',
					title: 'Peringatan',
					message: settings.maskMsg || "Format tidak sesuai"
				});
			}
		});
	}

	me.val = function (v) {
		if (typeof v == "undefined") {
			return $konten.val() || $konten.find("input").val() || "";
		} else {
			$konten.val(v);
			$konten.find("input").val(v)
		}
	}

	me.renderTo = function (obj) {
		if (typeof settings.infoHolder == 'object') {
			$wrap = $('<div class="it-infoBox"/>');
			$konten = $wrap.append($konten);

			var infoText = typeof settings.infoHolder.text != 'undefined' ? settings.infoHolder.text : '';
			infoText = typeof settings.infoHolder.icon != 'undefined' ? '<span class="fa fa-' + settings.infoHolder.icon + '"></span>' : infoText;
			$konten.prepend('<div class=\"keterangan ' + settings.infoHolder.position + '\"> ' + infoText + ' </div>');
		}
		if (settings.searchButton) {
			$konten.attr("readonly", true);
			$wrap = $('<div class="it-search-box"/>');
			$konten = $wrap.append($konten);

			var btnS = new Button({
				iconCls: 'search-plus',
				text: 'Cari',
				handler: settings.handler || null
			});

			btnS.renderTo($konten);

			$konten.find("input").click(function () {
				$konten.find(".it-btn").click();
			});
		}

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

function Panel(params) {
	var settings = $.extend({
		iconCls: '',
		title: '',
		height: 0,
		column: false,
		items: []
	}, params);

	var me = this;
	var parent = null;
	var id = makeid();
	var items = settings.items;

	var height = settings.height != 0 ? 'style="height:' + settings.height + '"' : '';
	var htmlTitle = settings.title == '' ? '' : '<div class="it-title"> <span class="fa fa-' + settings.iconCls + '"> </span> ' + settings.title + '</div>';
	var konten = '<article id="it-konten" id="' + id + '" ' + getStyle(settings) + '>' + htmlTitle + '</article>';

	konten = settings.column ? '<section class="column" ' + height + '>' + htmlTitle + '</section>' : konten;
	var $konten = $(konten);
	for (var i = 0; i < items.length; i++) {
		if (items[i] === null) continue;
		var item = null;

		if (typeof items[i].renderTo == 'function') {
			item = items[i];
		} else if (typeof items[i] == 'object') {
			item = createObject(items[i]);
		}

		item.renderTo($konten);
	}

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

	for (var i = 0; i < items.length; i++) {
		if (items[i] === null) continue;
		var item = null;
		if (typeof items[i].renderTo == 'function') {
			item = items[i];
		} else if (typeof items[i] == 'object') {
			item = createObject(items[i]);
		}
		item.renderTo(me.content);
	}

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