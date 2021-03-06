/*
* XML Viewer for jquery
* https://github.com/wawawoom/XmlViewer/
* Copyright (c) 2015 - Nicolas Payrouse
* Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php)
* Version: 0.1
*/
 
(function($) {
	
	$.fn.xmlViewer = function(params) {
		
		var _p = {};
		_p = $.extend(_p, params);
		
		var _wrapperClassName = 'xmlViewer';
		var _autoCloseTagRegex = new RegExp('^(?:area|br|col|embed|hr|img|input|meta|param)$', 'i');

		var _temp = [];
		var _this = this;

		var _xmlViewerMenu = '';
		_xmlViewerMenu += '<div class="xmlViewerMenu">';
		_xmlViewerMenu += '<span class="xmlViewerMenuItem xmlViewerMenuCollapseAll">Collapse all</span>';
		_xmlViewerMenu += '<span class="xmlViewerMenuItem xmlViewerMenuExpandAll">Expand all</span>';
		_xmlViewerMenu += '</div>';


		var _minify = function (text) {
			var str = 
				text.replace(/(\r\n|\n|\r)/gm,"")
					.replace(/\<![ \r\n\t]*(--([^\-]|[\r\n]|-[^\-])*--[ \r\n\t]*)\>/g,"")
					.replace(/[ \r\n\t]{1,}xmlns/g, ' xmlns');
			return str.replace(/>\s{0,}</g,"><"); 
		}
		
		var _buildTree = function(node) {
			
			_temp.push('<li>');

			// Opening tag
			if (node.nodeName != '#document') {

				if (node.hasChildNodes() && (node.firstChild != null && node.firstChild.nodeType != 3 && node.firstChild.nodeType != 4)) {
					_temp.push('<span class="openClose">▼</span>');
				}

				if(node.nodeType == 1) {

					_temp.push('<div class="anElement">');
					
					_temp.push('<span class="aTagSign">&lt;</span>');
					_temp.push('<span class="tagName">' + node.nodeName + '</span>');

					if (typeof node.attributes != 'undefined') {
						for (var i=0; i < node.attributes.length; i++) {
							_temp.push('<span class="tagAttr"> ' + node.attributes[i].name + '="</span>');
							_temp.push('<span class="tagAttrValue">' + node.attributes[i].value + '</span>');
							_temp.push('<span class="tagAttr">"</span>');
						}
					}

					//debugger;

					if(!_autoCloseTagRegex.test(node.tagName)) {
						_temp.push('<span class="aTagSign">&gt;</span>');
					} else {
						_temp.push('<span class="aTagSign"> /&gt;</span>');
					}

					_temp.push('</div>');
				}

			}
			
			

			if (node.hasChildNodes()) {
				if (node.firstChild != null && node.firstChild.nodeType != 3 && node.firstChild.nodeType != 4) {
					_temp.push('<ul>');
					for (var i = 0; i < node.childNodes.length; i++ ) {
						_buildTree(node.childNodes[i]);
					}
					_temp.push('</ul>');	
				} else {
					if (node.textContent != '') {
						_temp.push('<span class="tagValue">');
						_temp.push(node.textContent);
						_temp.push('</span>');
					}
				}
			}

			// Closing tag
			if (node.nodeName != '#document') {
				
				if(!_autoCloseTagRegex.test(node.tagName)) {
					_temp.push('<div class="anElement">');

					_temp.push('<span class="aTagSign">&lt;/</span>');
					_temp.push('<span class="tagName">' + node.nodeName + '</span>');
					_temp.push('<span class="aTagSign">&gt;</span>');
					
					_temp.push('</div>');
				}
				

				_temp.push('</li>');
			}
			

		}
		
		var _bindEvents = function () {

			$(_this.selector)
			.on('click', '.openClose', function () {
				
				//console.log('ici');

				var _parentLi = $(this).closest('li');
				if (_parentLi.hasClass('collapsed')) {
					$(this).text('▼');
					_parentLi.removeClass('collapsed');
					$(this).closest('li').find('> ul').show();
				} else {
					$(this).text('▶');
					_parentLi.addClass('collapsed');
					$(this).closest('li').find('> ul').hide();
				}
				
			});
			
			// Collapse all
			$(_this.selector)
			.on('click', '.xmlViewerMenuCollapseAll', function () {
				
				$('.openClose').each(function() {
					$(this).text('▶');
					$(this).closest('li').addClass('collapsed');
					$(this).siblings('ul').hide();
				});
				
			});

			// Expand All
			$(_this.selector)
			.on('click', '.xmlViewerMenuExpandAll', function () {
				
				$('.openClose').each(function() {
					$(this).text('▼');
					$(this).closest('li').removeClass('collapsed');
					$(this).siblings('ul').show();
				});
				
			});

			// Double click on tag value
			$(_this.selector)
			.on('dblclick', '.tagValue', function (){
				
				$(this).attr('contenteditable', true);
				$(this).focus();
				document.execCommand('selectAll',false,null);

			});

			// On focus select all text
			$(_this.selector)
			.on('focus', '.tagValue[contenteditable="true"]', function (){
				
				window.setTimeout(function() {
					var sel, range;
					if (window.getSelection && document.createRange) {
						range = document.createRange();
						range.selectNodeContents($(this)[0]);
						sel = window.getSelection();
						sel.removeAllRanges();
						sel.addRange(range);
					} else if (document.body.createTextRange) {
						range = document.body.createTextRange();
						range.moveToElementText($(this)[0]);
						range.select();
					}
				}, 1);

			});

			$(_this.selector)
			.on('blur', '.tagValue[contenteditable="true"]', function (){
				
				$(this).removeAttr('contenteditable');

			});


			
		}
		
		
		var _create = function(xmlString, $this) {

			// More infos on this page : https://gist.github.com/eligrey/1129031
			var _parser = null;
			var _html = [];
			var _wrapper = '<div class="' + _wrapperClassName + '"></div>';
			var _xmlDoc = null;
			
			//debugger;
			console.log(xmlString);

			//_parser = $.parseXML( xmlString );
			
			if (window.DOMParser) {
				_parser = new DOMParser();
				//  mimeType must be one of: 
				// 'text/html'
				// 'text/xml'
				// 'application/xml'
				// 'application/xhtml+xml'
				// 'image/svg+xml' 
				_xmlDoc = _parser.parseFromString(_minify(xmlString), "text/xml");
			}
			else {// Internet Explorer
				_xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
				_xmlDoc.async = "false";
				_xmlDoc.loadXML(_minify(xmlString));
			}

			_html.push('<ul>');
			_buildTree(_xmlDoc);
			_html.push(_temp);
			_html.push('</ul>');
			
			_temp = [];
			
			//$this.addClass('xmlViewerOriginal');
			$this.wrap(_wrapper);
			$this.parent()
				.prepend(_xmlViewerMenu)
				.append('<div class="xmlRender">' + [].concat.apply([], _html).join('') + '</div>');
			$this.hide();
			
		}
		
		// Traverser tous les nœuds.
		this.each(function() {

			var $this = $(this);
			
			if (typeof _p.url != 'undefined' && _p.url != '' && _p.url != null) {
				$.ajax({
					url: _p.url,
					dataType: 'text',
					success: function (data) {
						_create(
							data,
							$this
						);
						
					}
				});
			}

			else if (typeof _p.cssSelector != 'undefined' && _p.cssSelector != '' && _p.cssSelector != null) {

				_create(
					$(_p.cssSelector)[0].outerHTML,
					$(_p.cssSelector)
				);
			}

		});
		
		_bindEvents(this);
		
		// Keep chainability
		return this;
		
	};
}) (jQuery);
