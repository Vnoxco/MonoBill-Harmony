const url_params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});


window.MONO = {
    get: function (url, data, success, error) {
        if (typeof data === "function") {
            error = success;
            success = data;
            data = {};
        }
        
        
        if(typeof url === 'object') {
            data = url.data;
            success = url.success;
            error = url.error;
            url = url.url;
        }
        
        return MONO.ajax(url, "GET", data, false, success, error);
    },
    post: function (url, data, success, error) {
        if (typeof data === "function") {
            error = success;
            success = data;
            data = {};
        }
        if(typeof url === 'object') {
            data = url.data;
            success = url.success;
            error = url.error;
            url = url.url;
        }
        return MONO.ajax(url, "POST", data, false, success, error);
    },
    put: function (url, data, success, error) {
        if (typeof data === "function") {
            error = success;
            success = data;
            data = {};
        }
        if(typeof url === 'object') {
            data = url.data;
            success = url.success;
            error = url.error;
            url = url.url;
        }
        return MONO.ajax(url, "PUT", data, false, success, error);
    },
    delete: function (url, data, success, error) {
        if (typeof data === "function") {
            error = success;
            success = data;
            data = {};
        }
        if(typeof url === 'object') {
            data = url.data;
            success = url.success;
            error = url.error;
            url = url.url;
        }
        return MONO.ajax(url, "DELETE", data, false, success, error);
    },
    ajax: function (url, type, data, cache, success, error) {
        if (typeof FormData == 'undefined' || !(data instanceof FormData) && typeof data == "object" || typeof data == "object" && !(data instanceof FormData)) {
            data = $.param(data);
        }
    
        let tokenString = '';
        if (typeof csrfToken !== "undefined") {
            tokenString = '&_token=' + csrfToken;
        }
    
        let options = {
            type: type,
            url: url,
            cache: cache,
            crossDomain: true,
            headers : { 
              'ngrok-skip-browser-warning':true,
              'accept': 'application/json'
            },
            async: true,
            success: function (data, textStatus, xhr) {
                if (typeof data !== "undefined" && typeof data.redirect_url !== "undefined") {
                    Route.to(data.redirect_url, true);
                }
                if (typeof grecaptcha != 'undefined') {
                    grecaptcha.reset();
                }
                if (typeof success === "function") success(data, textStatus, xhr);
            },
            error: function (request, err) {
                if (typeof grecaptcha != 'undefined') {
                    grecaptcha.reset();
                }
                if (typeof error === "function") error(request, err);
            }
        };
        if (typeof FormData !== 'undefined' && data instanceof FormData) {
            options.processData = false;
            options.contentType = false;
            options.data = data;
        } else {
            options.data = data + tokenString;
        }
        return $.ajax(options);
    },
    getOrders: function(time, callback) {
        this.get(this.mbURL('/account/orders/json'), {
            period: time,
        }, function(response) {
            callback(response.content.orders);
        }, function(err) {
            //TODO alert error loading orders.
        })
    },
    getEstimates: function(time, callback) {
        this.get(this.mbURL('/account/estimates/json'), {
            period: time,
        }, function(response) {
            callback(response.content.estimates);
        }, function(err) {
            //TODO alert error loading orders.
        })
    },
    mbURL: function(uri) {
        if (!uri) {
            return window.location.href;
        }
        if(!uri.startsWith('/')) {
            uri = '/' + uri;
        }
        
        let url = window.location.origin + uri;
        
        let hashParts = uri.split('#');
        
        let hash = (hashParts.length > 1) ? hashParts[1] : null;
    
    
        if(hash) {
            //Remove the hash from the URL and add it back later or else this will cause problems with the query parameters.
            url = url.replaceAll('#' + hash, '');
        }
    
        let keysToKeep = [
            'theme_editor',
            'theme',
            'authenticated',
            'dev-preview'
        ];
        
        for(let i = 0; i < keysToKeep.length; i++) {
            let key = keysToKeep[i];
            if(this.queryExists(key)) {
                if(url.indexOf('?') !== -1) {
                    url += '&' + key + '=' + this.query(key);
                } else {
                    url += '?' + key + '=' + this.query(key);
                }
            }
        }
        return url + ((hash) ? '#' + hash : '');
    },
    queryExists: function(key) {
        return (window.location.href.indexOf('?' + key + '=') != -1 || window.location.href.indexOf('&' + key + '=') != -1);
    },
    query: function(key) {
        let params = new URLSearchParams(new URL(window.location.href).search);
        return params.get(key);
    },
    formatMoney: function(number, currency, showCurrencySymbol, showCurrencyCode, min, max, multiplier) {
        let decimal_places = currency.decimals;
        let decimal_point = currency.decimal_point;
        let thousands_separator = currency.thousands_separator;
        number = number.toString().replaceAll(thousands_separator, '').replaceAll(decimal_point, '.');
        if(number < min) {
            number = min;
        }
        if(number > max) {
            number = max;
        }
        if(multiplier) {
            number = number * multiplier;
        }
        return (showCurrencySymbol ? currency.symbol : '') + this.formatNumber(number, decimal_places, decimal_point, thousands_separator) + (showCurrencyCode ? ' ' + currency.code : '');
    },
    formatNumber: function(number, decimals = 0, dec_point = '.', thousands_sep = ',') {
        const n = isFinite(+number) ? +number : 0;
        const prec = isFinite(+decimals) ? Math.abs(decimals) : 0;
        const sep = thousands_sep || ',';
        const dec = dec_point || '.';
        
        const toFixedFix = (num, precision) => {
            const k = Math.pow(10, precision);
            return Math.round(num * k) / k;
        };
        
        let [integerPart, decimalPart] = (prec ? toFixedFix(n, prec) : Math.round(n)).toString().split('.');
        
        if (integerPart.length > 3) {
            integerPart = integerPart.replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
        }
        
        if ((decimalPart || '').length < prec) {
            decimalPart = decimalPart || '';
            decimalPart += '0'.repeat(prec - decimalPart.length);
        }
        
        return `${integerPart}${decimalPart ? dec + decimalPart : ''}`;
    }
};

let navOffcanvas = document.getElementById('navOffcanvas')
let bsNavOffcanvas = new bootstrap.Offcanvas(navOffcanvas);
navOffcanvas.addEventListener('show.bs.offcanvas', function () {
    $('[data-bs-target="#navOffcanvas"]').removeClass('collapsed');
})
navOffcanvas.addEventListener('hide.bs.offcanvas', function () {
    $('[data-bs-target="#navOffcanvas"]').addClass('collapsed');
})

$(function(){
    
    function checkCountry()
    {
        if(typeof no_postal_code_countries === 'undefined') return;
        let val = $('.country-select').val();
        if(no_postal_code_countries.includes(val)) {
            $('#postal_container').addClass('d-none');
            $('#country_container').removeClass('col-lg-4');
            $('#country_container').removeClass('col-lg-6');
            $('#country_container').addClass('col-12');
            $('#state_container').addClass('d-none');
        } else {
            $('#postal_container').removeClass('d-none');
            $('#country_container').addClass('col-lg-6');
        }
        if(val === 'AE') {
            $('#country_container').addClass('col-lg-6');
            $('#state_container').removeClass('d-none');
            $('#state_container').addClass('col-lg-6');
            $('#state_container').removeClass('col-lg-4');
        } else if(val === 'US' || val === 'GB' || val === 'CA') {
            $('#state_container').removeClass('d-none');
            $('#state_container').removeClass('col-lg-6');
            $('#state_container').addClass('col-lg-4');
            $('#postal_container').removeClass('d-none');
            $('#postal_container').removeClass('col-lg-6');
            $('#postal_container').addClass('col-lg-4');
            $('#country_container').removeClass('col-lg-12');
            $('#country_container').removeClass('col-lg-6');
            $('#country_container').addClass('col-lg-4');
        } else {
            $('#state_container').addClass('d-none');
            $('#postal_container').addClass('col-lg-6');
            $('#postal_container').removeClass('col-lg-4');
        }
        
        if(val === 'AE') {
            $('#state').parent().find('.floating-label').html('Emirate');
            $('#state').html('');
            var options = [];
            $.each(arab_emirates, function(key, value)
            {
              options.push('<option value="'+ key +'">'+ value +'</option>');
            });
            $('#state').html(options.join(''));
        }
        if(val === 'US') {
            $('#state').parent().find('.floating-label').html('State');
            $('#state').html('');
           var options = [];
            $.each(us_states, function(key, value)
            {
              options.push('<option value="'+ key +'">'+ value +'</option>');
            });
            $('#state').html(options.join(''));
        }
        if(val === 'GB') {
            $('#state').parent().find('.floating-label').html('Region');
            $('#state').html('');
            var options = [];
            $.each(gb_regions, function(key, value)
            {
              options.push('<option value="'+ key +'">'+ value +'</option>');
            });
            $('#state').html(options.join(''));
        }
        if(val === 'CA') {
            $('#state').parent().find('.floating-label').html('Province');
            $('#state').html('');
            var options = [];
            $.each(canada_provinces, function(key, value)
            {
              options.push('<option value="'+ key +'">'+ value +'</option>');
            });
            $('#state').html(options.join(''));
        }
    }
    
    checkCountry();
    
    $('body').on('change', '.country-select', function(){
      checkCountry();
    });
    
    $('body').on('click', '[data-mb-toggle-drawer]', function(e){
        $('.modal').modal('hide');
        e.preventDefault();
        let drawerId = $(this).data('mb-toggle-drawer');
        let drawerBody = $(drawerId).find('.drawer-body');
        
        if(drawerBody.hasClass('scroll')){
            $('body').css({overflow: 'hidden'});
        }
        
        $(drawerId).find('.drawer-body.right').css({
           right: '-450px' 
        });
        $(drawerId).find('.drawer-body.right').animate({
            right: "+=450",
        }, 300);
        
        $(drawerId).addClass('shown');
    });
    
    
    $('body').on('click', '.drawer .btn.close-btn', function(e){
        e.preventDefault();
        let drawerBody = $(this).closest('.drawer-body');
        if(drawerBody.hasClass('scroll')){
            $('body').css({overflow: ""});
        }
        $(this).closest('.drawer-body.right').animate({
                right: "-=450",
        }, 300, function() {
            $(this).closest('.drawer').removeClass('shown');
        });
    });
    
    $('body').on('click', '.drawer', function(e){
        let target = $(e.target);
        if(target.hasClass('drawer')) {
            let drawerBody = target.find('.drawer-body');
            if(drawerBody.hasClass('scroll')){
                $('body').css({overflow: ""});
            }
            target.find('.drawer-body.right').animate({
                    right: "-=450",
            }, 300, function() {
                $(this).closest('.drawer').removeClass('shown');
            });
        }
    });
    
    function updateQueryStringParameter(uri, key, value) {
      var re = new RegExp("([?&])" + key + "=.*?(&|#|$)", "i");
      if (uri.match(re)) {
        return uri.replace(re, '$1' + key + "=" + value + '$2');
      } else {
        var hash =  '';
        if( uri.indexOf('#') !== -1 ){
            hash = uri.replace(/.*#/, '#');
            uri = uri.replace(/#.*/, '');
        }
        var separator = uri.indexOf('?') !== -1 ? "&" : "?";    
        return uri + separator + key + "=" + value + hash;
      }
    }
    
    $('body').on('slid.bs.carousel', '.carousel', function (e) {
        $('[data-bs-target="#' + $(this).attr('id') + '"][data-bs-slide-to="' + e.from + '"]').removeClass('selected');
        $('[data-bs-target="#' + $(this).attr('id') + '"][data-bs-slide-to="' + e.to + '"]').addClass('selected');
    });
                
    function updateCartItemQuantity(itemId) {
        let quantityInput = $('[data-cart-item-quantity-input="' + itemId + '"]');
        let cartItemId = quantityInput.data('cart-item-quantity-input');
        let quantity = quantityInput.val();
        
        quantityInput.parents('.cart-item').addClass('disabled');
        
        //Update the quantity using ajax...
        MONO.put('/cart/update-quantity/' + itemId + '?cuuid=' + window.cart_uuid, {
            quantity: quantity,
            _token: window.csrf_token
        }, function(data){
            if(!data.content.cart) {
                window.location.href = MONO.mbURL('/cart');
                return;
            }
            quantityInput.val(data.content.item_quantity);
            $('.mb_cart_subtotal_formatted').text(data.content.cart.subtotal_converted_formatted_long);
            $('.mb_cart_quantity').text(data.content.cart.quantity);
            quantityInput.parents('.cart-item').removeClass('disabled');
        }, function() {
            quantityInput.parents('.cart-item').removeClass('disabled');
        });
    }
    
    $('body').on('blur', '[data-cart-item-quantity-input]', function(){
        updateCartItemQuantity($(this).data('cart-item-quantity-input'));
    });
    
    $('body').on('click', '[data-update-item-quantity]', function(){
        updateCartItemQuantity($(this).data('update-item-quantity'));
    });
    
    $('body').on('click', '[data-cart-item-remove]', function(e){
        e.preventDefault();
        let removeBtn = $(this);
        let cartItemId = removeBtn.data('cart-item-remove');
        removeBtn.parents('.cart-item').addClass('disabled');
        MONO.delete(MONO.mbURL('/cart/remove-item/' + cartItemId + '?cuuid=' + window.cart_uuid), {
            _token: window.csrf_token
        }, function(data){
            if(!data.content.cart) {
                window.location.href = MONO.mbURL('/cart');
            } else {
                removeBtn.parents('.cart-item').remove();
                $('.mb_cart_subtotal_formatted').text(data.content.cart.subtotal_formatted_long);
                $('.mb_cart_quantity').text(data.content.cart.quantity);
            }
        }, function() {
            removeBtn.parents('.cart-item').removeClass('disabled');
        });
    });

    $('body').on('click', '[data-remove-address]', function(e) {
        $('#mb__remove_address_form').attr('action', MONO.mbURL('/account/addresses/' + $(this).data('remove-address')));
    })

    const searchInput = $("#mb__search_input");
    
    function setCursorOnEndofSearchInput() {
        var length = searchInput.val().length;
        searchInput[0].setSelectionRange(length, length);
    }
    
    function focusSearchInput() {
        searchInput.focus();
        //For mobile to automatically focus the search input
        searchInput.trigger('touchstart');
        setCursorOnEndofSearchInput();
    }
    
    function handleSearchBtn(event) {
        event.preventDefault();
        bsNavOffcanvas.hide();
        $('#mb__search_container').fadeIn("fast");
        setTimeout(function() {
            focusSearchInput();
        }, 500)
    }
    
    document.getElementById('mb__search_btn').addEventListener('click', handleSearchBtn);
    
    //For mobile to automatically focus the search input
    searchInput.on('touchstart', function(event) {
        event.target.focus();
    }, { passive: true });
    
    function closeSearchContainer() {
        $('#mb__search_container').fadeOut("fast");
        document.getElementById('mb__search_input').value = "";
    }
    
    $('#mb__search_dismiss_btn').on('click',  function (event) {
        event.preventDefault();
        closeSearchContainer();
    });
    
    let resultsLength = 0;
    let lastQuery = null;
    let searchTimeout = null;
    let searching = false;
    let currentCursorPos = -1;
    
    function spin() {
            $('.mb__search-icon').css('display', 'none');
            $('.mb__search-spinner').css('display', 'block');
        }
        
    function stopSpin() {
        $('.mb__search-icon').css('display', 'block');
        $('.mb__search-spinner').css('display', 'none');
    }
    
    let searchCache = [];
    
    function handleSearch(query, hideSpinner, hideAutoComplete) {
        
        if(searchTimeout) {
            clearTimeout(searchTimeout);
            stopSpin();
            searchTimeout = null;
        }
        
        if(query.length == 0) {
            resultsLength = 0;
            lastQuery = null;
            $('#mb__search_autocomplete').css('display', 'none');
            $('#mb__search_autocomplete').html('');
            currentCursorPos = -1;
            return;
        }
        
        if(lastQuery == query) {
            return;
        }
        
        lastQuery = query;
        
        searchTimeout = setTimeout(function() {
            if(!hideSpinner && searching) {
                spin();
            }
        }, 400);
        
        searching = true;
        
        currentCursorPos = -1;
        
        function handleResponse(response) {
            response = response.hits;
            resultsLength = response.length;
            if(response.length && !hideAutoComplete && searchInput.val().length) {
                $('#mb__search_autocomplete').css('display', 'block');
            } else {
                $('#mb__search_autocomplete').css('display', 'none');
            }
            stopSpin();
            $('#mb__search_autocomplete').html('');
            for(let i = 0; i < response.length; i++) {
                let result = response[i]._source;
                if(result.image_url.length == 0) {
                    result.image_url = 'https://monobill.nyc3.cdn.digitaloceanspaces.com/img%2Fplaceholder-img.jpg';
                }
                $('#mb__search_autocomplete').append('<a data-search-index="' + i + '" href="' + MONO.mbURL(result.url) + '">' +
                            '<div class="mb__search-result">' +
                                '<div class="mb__search-result-img"><img src="' + result.image_url + '" alt=""></div>' +
                                '<div class="mb__search-result-txt">' + result.name + '</div>' +
                            '</div>' +
                        '</a>')
            }
            $(".mb__search-result-txt").mark(query);
            searching = false;
        }
        
        if(typeof searchCache[query] !== 'undefined') {
            searching = false;
            stopSpin();
            handleResponse(searchCache[query] );
        } else {
            MONO.get('https://search.monobill.com/autocomplete/' + store_id + '/products?sales_channel=online_store&q=' + query, function(response) {
                searchCache[query] = response;
                handleResponse(response);
            }, function() {
                resultsLength = 0;
                $('#mb__search_autocomplete').html('');
                $('#mb__search_autocomplete').css('display', 'none');
                searching = false;
                stopSpin();
            });
        }
        
    }
    
    if(searchInput.val().length) {
        handleSearch(searchInput.val(), true, true);
    }
    
    function scrollUpSearchResults() {
        if(currentCursorPos === -1 || currentCursorPos - 1 < 0) {
            currentCursorPos = resultsLength - 1;
        } else {
            currentCursorPos -= 1;
        }
        $('#mb__search_autocomplete').find('[data-search-index="' + currentCursorPos + '"]').focus();
    }
    
    function scrollDownSearchResults() {
        if(currentCursorPos === -1 || currentCursorPos + 1 > resultsLength - 1) {
            currentCursorPos = 0;
        } else {
            currentCursorPos += 1;
        }
        $('#mb__search_autocomplete').find('[data-search-index="' + currentCursorPos + '"]').focus();
    }
    
    $('body').on('keydown', function(e) {
        if(event.keyCode === 38 && resultsLength > 0 && ($('[data-search-index]:focus').length || searchInput.is(':focus'))) {
            e.preventDefault();
            scrollUpSearchResults();
        }
        if(event.keyCode === 40 && resultsLength > 0 && ($('[data-search-index]:focus').length || searchInput.is(':focus'))) {
            e.preventDefault();
            scrollDownSearchResults();
        }
        
        if(event.keyCode === 8 && resultsLength > 0 && $('[data-search-index]:focus').length) {
            e.preventDefault();
            focusSearchInput();
            searchInput.val(searchInput.val().substring(0, searchInput.val().length-1));
        }
    });
    
    searchInput.on('input click focus', function(e) {
        let query = $(this).val();
        handleSearch(query);
    });
    
    searchInput.on('focus', function(e) {
        if(resultsLength) {
            $('#mb__search_autocomplete').css('display', 'block');
        }
    });
    
    $('body').on('click', function(e) {
        if(!$(e.target).closest('.search-box').length && !$(e.target).closest('#mb__search_btn').length) {
            $('#mb__search_autocomplete').css('display', 'none');
        }
    });
    
    if($('.search-container.auto-hide').length) {
        $('body').on('click', function(e) {
            if(!$(e.target).closest('.search-container.auto-hide').length && !$(e.target).closest('#mb__search_btn').length) {
                closeSearchContainer();
            }
        });
    }
});

function mb__zoom(event){
    if (!matchMedia('(pointer:fine)').matches) {
        return
    }
    var image = event.currentTarget;
    event.offsetX ? offsetX = event.offsetX : offsetX = event.touches[0].pageX;
    event.offsetY ? offsetY = event.offsetY : offsetX = event.touches[0].pageX;
    x = offsetX / image.offsetWidth * 100;
    y = offsetY / image.offsetHeight * 100;
    image.style.backgroundPosition = x + '% ' + y + '%';
}


let quantitySpinnerEventTimeout = null;

$('body').on('click', '.mb__quantity_spinner_minus', function(e) {
    let input = $(this).parent().find('input');
    if(input.val() <= parseInt(input.attr('min'))) {
        return;
    }
    input.val(parseInt(input.val()) - 1);
    
    if(quantitySpinnerEventTimeout) {
        clearTimeout(quantitySpinnerEventTimeout);
    }
    quantitySpinnerEventTimeout = setTimeout(function() {
        input.trigger('blur');
    }, 800);
});


$('body').on('click', '.mb__quantity_spinner_plus', function(e) {
    let input = $(this).parent().find('input');
    if(input.val() >= parseInt(input.attr('max'))) {
        return;
    }
    input.val(parseInt(input.val()) + 1);
    if(quantitySpinnerEventTimeout) {
        clearTimeout(quantitySpinnerEventTimeout);
    }
    quantitySpinnerEventTimeout = setTimeout(function() {
        input.trigger('blur');
    }, 800);
});

let currencySelect = document.getElementById('mb__currency_select');

if(currencySelect) {
    currencySelect.addEventListener('change', function(e) {
        let url = new URL(window.location.href);
        url.searchParams.set('x_user_currency', e.target.value);
        window.location.href = url.href;
    });
}

let countrySelect = document.getElementById('mb__country_select');

if(countrySelect) {
    countrySelect.addEventListener('change', function(e) {
        let url = new URL(window.location.href);
        url.searchParams.set('x_user_country', e.target.value);
        window.location.href = url.href;
    });
}

let languageSelect = document.getElementById('mb__language_select');

if(languageSelect) {
    languageSelect.addEventListener('change', function(e) {
        let url = new URL(window.location.href);
        url.searchParams.set('x_user_language', e.target.value);
        window.location.href = url.href;
    });
}


function reloadSection(index, success) {
    let query = location.search;

    if(query.length) {
        query += '&render_section=' + index;
    } else {
        query += '?render_section=' + index;
    }
    
     MONO.get({
        url: location.pathname + query,
        timeout: 2,
        retry: 1,
        success: function(response) {
            success(response);
        }
     });
}