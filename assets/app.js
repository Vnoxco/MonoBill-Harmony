const url_params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});


window.MONO = {
    get: function (url, data, success, error) {
        if (typeof data === 'function') {
            error = success;
            success = data;
            data = {};
        }


        if (typeof url === 'object') {
            data = url.data;
            success = url.success;
            error = url.error;
            url = url.url;
        }

        return MONO.ajax(url, 'GET', data, false, success, error);
    },
    post: function (url, data, success, error) {
        if (typeof data === 'function') {
            error = success;
            success = data;
            data = {};
        }
        if (typeof url === 'object') {
            data = url.data;
            success = url.success;
            error = url.error;
            url = url.url;
        }
        return MONO.ajax(url, 'POST', data, false, success, error);
    },
    put: function (url, data, success, error) {
        if (typeof data === 'function') {
            error = success;
            success = data;
            data = {};
        }
        if (typeof url === 'object') {
            data = url.data;
            success = url.success;
            error = url.error;
            url = url.url;
        }
        return MONO.ajax(url, 'PUT', data, false, success, error);
    },
    delete: function (url, data, success, error) {
        if (typeof data === 'function') {
            error = success;
            success = data;
            data = {};
        }
        if (typeof url === 'object') {
            data = url.data;
            success = url.success;
            error = url.error;
            url = url.url;
        }
        return MONO.ajax(url, 'DELETE', data, false, success, error);
    },
    ajax: function (url, type, data, cache, success, error) {
        if (typeof FormData == 'undefined' || !(data instanceof FormData) && typeof data == 'object' || typeof data == 'object' && !(data instanceof FormData)) {
            data = $.param(data);
        }

        let tokenString = '';
        if (typeof csrfToken !== 'undefined') {
            tokenString = '&_token=' + csrfToken;
        }

        let options = {
            type: type,
            url: url,
            cache: cache,
            crossDomain: true,
            headers: {
                'ngrok-skip-browser-warning': true,
                'accept': 'application/json'
            },
            async: true,
            success: function (data, textStatus, xhr) {
                if (typeof data !== 'undefined' && typeof data.redirect_url !== 'undefined') {
                    Route.to(data.redirect_url, true);
                }
                if (typeof grecaptcha != 'undefined') {
                    grecaptcha.reset();
                }
                if (typeof success === 'function') success(data, textStatus, xhr);
            },
            error: function (request, err) {
                if (typeof grecaptcha != 'undefined') {
                    grecaptcha.reset();
                }
                if (typeof error === 'function') error(request, err);
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
    getOrders: function (time, callback) {
        this.get(this.mbURL('/account/orders/json'), {
            period: time,
        }, function (response) {
            callback(response.content.orders);
        }, function (err) {
            //TODO alert error loading orders.
        })
    },
    getEstimates: function (time, callback) {
        this.get(this.mbURL('/account/estimates/json'), {
            period: time,
        }, function (response) {
            callback(response.content.estimates);
        }, function (err) {
            //TODO alert error loading orders.
        })
    },
    mbURL: function (uri) {
        if (!uri) {
            return window.location.href;
        }
        if (!uri.startsWith('/')) {
            uri = '/' + uri;
        }

        let url = window.location.origin + uri;

        let hashParts = uri.split('#');

        let hash = (hashParts.length > 1) ? hashParts[1] : null;


        if (hash) {
            //Remove the hash from the URL and add it back later or else this will cause problems with the query parameters.
            url = url.replaceAll('#' + hash, '');
        }

        let keysToKeep = [
            'theme_editor',
            'theme',
            'authenticated',
            'dev-preview'
        ];

        for (let i = 0; i < keysToKeep.length; i++) {
            let key = keysToKeep[i];
            if (this.queryExists(key)) {
                if (url.indexOf('?') !== -1) {
                    url += '&' + key + '=' + this.query(key);
                } else {
                    url += '?' + key + '=' + this.query(key);
                }
            }
        }
        return url + ((hash) ? '#' + hash : '');
    },
    queryExists: function (key) {
        return (window.location.href.indexOf('?' + key + '=') != -1 || window.location.href.indexOf('&' + key + '=') != -1);
    },
    query: function (key) {
        let params = new URLSearchParams(new URL(window.location.href).search);
        return params.get(key);
    },
    formatMoney: function (number, currency, showCurrencySymbol, showCurrencyCode, min, max, multiplier) {
        let decimal_places = currency.decimals;
        let decimal_point = currency.decimal_point;
        let thousands_separator = currency.thousands_separator;
        number = number.toString().replaceAll(thousands_separator, '').replaceAll(decimal_point, '.');
        if (number < min) {
            number = min;
        }
        if (number > max) {
            number = max;
        }
        if (multiplier) {
            number = number * multiplier;
        }
        return (showCurrencySymbol ? currency.symbol : '') + this.formatNumber(number, decimal_places, decimal_point, thousands_separator) + (showCurrencyCode ? ' ' + currency.code : '');
    },
    formatNumber: function (number, decimals = 0, dec_point = '.', thousands_sep = ',') {
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

function updateOffcanvasTop() {
    const navbar = document.querySelector(".monobill__header header");
    const offcanvas = document.querySelector(".monobill__header .offcanvas");

    if (navbar && offcanvas) {
        let navbarHeight = navbar.offsetHeight;
        offcanvas.style.top = navbarHeight + "px";
    }
}

updateOffcanvasTop();

// Run the function on page load and window resize
window.addEventListener("load", updateOffcanvasTop);
window.addEventListener("resize", updateOffcanvasTop);

let lastScrollTop = 0;
const body = document.body;
window.addEventListener('scroll', function () {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    let headerElement = document.getElementsByTagName('header')[0];
    if (scrollTop > headerElement.offsetHeight) {
        body.classList.add('fixed-header');
        body.style.paddingTop = headerElement.offsetHeight + 'px';
    } else if(scrollTop == 0) {
        body.classList.remove('fixed-header');
        body.style.paddingTop = 0;
    }
    if (scrollTop > lastScrollTop || scrollTop === 0) {
        body.classList.remove('fixed-header-shown');
        headerElement.style.top = -headerElement.offsetHeight + 'px';
    } else {
        body.classList.add('fixed-header-shown');
        headerElement.style.top = 0;
    }
    lastScrollTop = scrollTop;
});

function onTab(event) {
    if (event.key === 'Tab') {
        document.documentElement.classList.add('mb__tabbing');
        window.removeEventListener('keydown', onTab);
        window.addEventListener('mousedown', onMouse);
    }
}

function onMouse() {
    document.documentElement.classList.remove('mb__tabbing');
    window.removeEventListener('mousedown', onMouse);
    window.addEventListener('keydown', onTab);
}

window.addEventListener('keydown', onTab);

$(function () {

    function checkCountry() {
        if (typeof no_postal_code_countries === 'undefined') return;
        let val = $('.country-select').val();
        if (no_postal_code_countries.includes(val)) {
            $('#postal_container').addClass('d-none');
            $('#country_container').removeClass('col-lg-4');
            $('#country_container').removeClass('col-lg-6');
            $('#country_container').addClass('col-12');
            $('#state_container').addClass('d-none');
        } else {
            $('#postal_container').removeClass('d-none');
            $('#country_container').addClass('col-lg-6');
        }
        if (val === 'AE') {
            $('#country_container').addClass('col-lg-6');
            $('#state_container').removeClass('d-none');
            $('#state_container').addClass('col-lg-6');
            $('#state_container').removeClass('col-lg-4');
        } else if (val === 'US' || val === 'GB' || val === 'CA') {
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

        if (val === 'AE') {
            $('#state').parent().find('.floating-label').html('Emirate');
            $('#state').html('');
            var options = [];
            $.each(arab_emirates, function (key, value) {
                options.push('<option value="' + key + '">' + value + '</option>');
            });
            $('#state').html(options.join(''));
        }
        if (val === 'US') {
            $('#state').parent().find('.floating-label').html('State');
            $('#state').html('');
            var options = [];
            $.each(us_states, function (key, value) {
                options.push('<option value="' + key + '">' + value + '</option>');
            });
            $('#state').html(options.join(''));
        }
        if (val === 'GB') {
            $('#state').parent().find('.floating-label').html('Region');
            $('#state').html('');
            var options = [];
            $.each(gb_regions, function (key, value) {
                options.push('<option value="' + key + '">' + value + '</option>');
            });
            $('#state').html(options.join(''));
        }
        if (val === 'CA') {
            $('#state').parent().find('.floating-label').html('Province');
            $('#state').html('');
            var options = [];
            $.each(canada_provinces, function (key, value) {
                options.push('<option value="' + key + '">' + value + '</option>');
            });
            $('#state').html(options.join(''));
        }
    }

    checkCountry();

    $('body').on('change', '.country-select', function () {
        checkCountry();
    });

    $('body').on('click', '[data-mb-toggle-drawer]', function (e) {
        $('.modal').modal('hide');
        e.preventDefault();
        let drawerId = $(this).data('mb-toggle-drawer');
        let drawerBody = $(drawerId).find('.drawer-body');

        if (drawerBody.hasClass('scroll')) {
            $('body').css({overflow: 'hidden'});
        }

        $(drawerId).find('.drawer-body.right').css({
            right: '-450px'
        });
        $(drawerId).find('.drawer-body.right').animate({
            right: '+=450',
        }, 300);

        $(drawerId).addClass('shown');
    });


    $('body').on('click', '.drawer .btn.close-btn', function (e) {
        e.preventDefault();
        let drawerBody = $(this).closest('.drawer-body');
        if (drawerBody.hasClass('scroll')) {
            $('body').css({overflow: ''});
        }
        $(this).closest('.drawer-body.right').animate({
            right: '-=450',
        }, 300, function () {
            $(this).closest('.drawer').removeClass('shown');
        });
    });

    $('body').on('click', '.drawer', function (e) {
        let target = $(e.target);
        if (target.hasClass('drawer')) {
            let drawerBody = target.find('.drawer-body');
            if (drawerBody.hasClass('scroll')) {
                $('body').css({overflow: ''});
            }
            target.find('.drawer-body.right').animate({
                right: '-=450',
            }, 300, function () {
                $(this).closest('.drawer').removeClass('shown');
            });
        }
    });

    function updateQueryStringParameter(uri, key, value) {
        var re = new RegExp('([?&])' + key + '=.*?(&|#|$)', 'i');
        if (uri.match(re)) {
            return uri.replace(re, '$1' + key + '=' + value + '$2');
        } else {
            var hash = '';
            if (uri.indexOf('#') !== -1) {
                hash = uri.replace(/.*#/, '#');
                uri = uri.replace(/#.*/, '');
            }
            var separator = uri.indexOf('?') !== -1 ? '&' : '?';
            return uri + separator + key + '=' + value + hash;
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
        MONO.put(MONO.mbURL('/cart/update-quantity/' + itemId + '?cuuid=' + window.cart_uuid), {
            quantity: quantity,
            _token: window.csrf_token
        }, function (data) {
            if (!data.content.cart) {
                window.location.href = MONO.mbURL('/cart');
                return;
            }
            if (data.content.item_quantity == 0) {
                quantityInput.parents('.cart-item').remove();
            } else {
                quantityInput.val(data.content.item_quantity);
            }
            $('.mb_cart_subtotal_formatted').text(data.content.cart.subtotal_converted_formatted_long);
            $('.mb_cart_quantity').text((data.content.cart.quantity) > 99 ? '99+' : data.content.cart.quantity);
            $('.mb_cart_quantity').addClass('active');
            quantityInput.parents('.cart-item').removeClass('disabled');
        }, function () {
            quantityInput.parents('.cart-item').removeClass('disabled');
        });
    }

    $('body').on('blur', '[data-cart-item-quantity-input]', function () {
        updateCartItemQuantity($(this).data('cart-item-quantity-input'));
    });

    $('body').on('click', '[data-update-item-quantity]', function () {
        updateCartItemQuantity($(this).data('update-item-quantity'));
    });

    $('body').on('click', '[data-cart-item-remove]', function (e) {
        e.preventDefault();
        let removeBtn = $(this);
        let cartItemId = removeBtn.data('cart-item-remove');
        removeBtn.parents('.cart-item').addClass('disabled');
        MONO.delete(MONO.mbURL('/cart/remove-item/' + cartItemId + '?cuuid=' + window.cart_uuid), {
            _token: window.csrf_token
        }, function (data) {
            if (!data.content.cart) {
                window.location.href = MONO.mbURL('/cart');
            } else {
                removeBtn.parents('.cart-item').remove();
                $('.mb_cart_subtotal_formatted').text(data.content.cart.subtotal_formatted_long);
                $('.mb_cart_quantity').text((data.content.cart.quantity) > 99 ? '99+' : data.content.cart.quantity);
                $('.mb_cart_quantity').addClass('active');
            }
        }, function () {
            removeBtn.parents('.cart-item').removeClass('disabled');
        });
    });

    $('body').on('click', '[data-remove-address]', function (e) {
        $('#mb__remove_address_form').attr('action', MONO.mbURL('/account/addresses/' + $(this).data('remove-address')));
    })

    const searchInput = $('#mb__search_input');
    let autoCompleteContainer = $('#mb__search_autocomplete');

    function setCursorOnEndofSearchInput() {
        var length = searchInput.val().length;
        searchInput[0].setSelectionRange(length, length);
    }

    function focusSearchInput() {
        setTimeout(function () {
            searchInput.focus();
            //For mobile to automatically focus the search input
            searchInput.trigger('touchstart');
            setCursorOnEndofSearchInput();
        }, 300);
    }

    function handleSearchBtn(event) {
        event.preventDefault();
        bsNavOffcanvas.hide();
        let searchContainer = $('#mb__search_container');
        searchContainer.addClass('active');

        if (window.innerHeight >= 800) {
            autoCompleteContainer.css('max-height', 800);
        } else {
            let distanceFromTop = autoCompleteContainer[0].getBoundingClientRect().top;
            autoCompleteContainer.css('max-height', window.innerHeight - distanceFromTop - 10);
        }
        $('body').addClass('overflow-hidden');
        focusSearchInput();
    }

    function closeSearchContainer() {
        $('#mb__search_container').removeClass('active');
        autoCompleteContainer.css('display', 'none');
        $('body').removeClass('overflow-hidden');
    }

    document.getElementById('mb__search_btn').addEventListener('click', handleSearchBtn);

    //For mobile to automatically focus the search input
    searchInput.on('touchstart', function (event) {
        event.target.focus();
    }, {passive: true});

    $('#mb__search_dismiss_btn').on('click', function (event) {
        event.preventDefault();
        closeSearchContainer();
    });


    let lastQuery = null;
    let searchTimeout = null;
    let searching = false;
    let currentCursorPos = 0;

    function spin() {
        $('.mb__search-icon').css('display', 'none');
        $('.mb__search-spinner').css('display', 'block');
    }

    function stopSpin() {
        $('.mb__search-icon').css('display', 'block');
        $('.mb__search-spinner').css('display', 'none');
    }

    let searchCache = [];
    let mbSearchTimeout = null;

    function handleSearch(query, hideSpinner, hideAutoComplete, delay) {

        if (searchTimeout) {
            clearTimeout(searchTimeout);
            stopSpin();
            searchTimeout = null;
        }

        if (query.length === 0) {
            lastQuery = null;
            autoCompleteContainer.css('display', 'none');
            autoCompleteContainer.html('');
            currentCursorPos = 0;
            return;
        }

        if (lastQuery === query) {
            if (!hideAutoComplete) {
                autoCompleteContainer.css('display', 'block');
            }
            return;
        }

        if (!delay) {
            delay = 400;
        }

        lastQuery = query;

        searching = true;

        function handleResponse(response) {
            autoCompleteContainer.html(response.html);
            if (!hideAutoComplete) {
                autoCompleteContainer.css('display', 'block');
            }
            stopSpin();
            $('.mb__search_result_txt').mark(query);
            searching = false;
        }

        if (typeof searchCache[query] !== 'undefined') {
            searching = false;
            stopSpin();
            handleResponse(searchCache[query]);
        } else {
            if (mbSearchTimeout) {
                clearTimeout(mbSearchTimeout);
            }
            mbSearchTimeout = setTimeout(function () {
                if (!hideSpinner && searching) {
                    spin();
                }
                MONO.get(MONO.mbURL('/search/auto-complete?section_id=search_autocomplete.twig&q=' + query), function (response) {
                    mbSearchTimeout = null;
                    searchCache[query] = response;
                    handleResponse(response);
                }, function () {
                    mbSearchTimeout = null;
                    autoCompleteContainer.html('');
                    autoCompleteContainer.css('display', 'none');
                    searching = false;
                    stopSpin();
                });
            }, delay)
        }
    }

    if (searchInput.val().length) {
        handleSearch(searchInput.val(), true, true, 0);
    }

    function scrollUpSearchResults() {
        if (currentCursorPos - 1 <= 0) {
            currentCursorPos = $('.mb__autocomplete').data('results-count');
        } else {
            currentCursorPos -= 1;
        }
        autoCompleteContainer.find('[data-search-index]').removeClass('selected');
        let elem = autoCompleteContainer.find('[data-search-index="' + currentCursorPos + '"]');
        elem.addClass('selected');
        autoCompleteContainer.scrollTop(autoCompleteContainer.scrollTop() + elem.position().top);
    }

    function scrollDownSearchResults() {
        if (currentCursorPos + 1 > $('.mb__autocomplete').data('results-count')) {
            currentCursorPos = 1;
        } else {
            currentCursorPos += 1;
        }
        autoCompleteContainer.find('[data-search-index]').removeClass('selected');
        let elem = autoCompleteContainer.find('[data-search-index="' + currentCursorPos + '"]');
        elem.addClass('selected');
        autoCompleteContainer.scrollTop(autoCompleteContainer.scrollTop() + elem.position().top);
    }

    $('body').on('keydown', function (e) {
        if (event.keyCode === 38 && $('.mb__autocomplete').data('results-count') > 0 && ($('[data-search-index]:focus').length || searchInput.is(':focus'))) {
            e.preventDefault();
            scrollUpSearchResults();
        }
        if (event.keyCode === 40 && $('.mb__autocomplete').data('results-count') > 0 && ($('[data-search-index]:focus').length || searchInput.is(':focus'))) {
            e.preventDefault();
            scrollDownSearchResults();
        }

        if (event.keyCode === 8 && $('.mb__autocomplete').data('results-count') > 0 && $('[data-search-index]:focus').length) {
            e.preventDefault();
            focusSearchInput();
            searchInput.val(searchInput.val().substring(0, searchInput.val().length - 1));
        }
    });

    searchInput.on('input click focus', function (e) {
        let query = $(this).val();
        handleSearch(query);
    });

    searchInput.on('focus', function (e) {
        if ($('.mb__autocomplete').data('results-count')) {
            $('#mb__search_autocomplete').css('display', 'block');
        }
    });

    searchInput.on('keydown', function (e) {
        let keyCode = e.keyCode || e.which;
        if (keyCode === 9) {
            closeSearchContainer();
        }
        if (keyCode === 13) {
            let selectedSearchResult = $('[data-search-index="' + currentCursorPos + '"].selected');
            if (selectedSearchResult.length) {
                e.preventDefault();
                window.location.href = selectedSearchResult.attr('href');
            }
        }
    });

    if ($('.search-container.auto-hide').length) {
        $('.mb__search_overlay').on('click', function (e) {
            closeSearchContainer();
        });
    }

    $('body').on('click', function (e) {
        if ($(e.target).closest('.search-container').length) {
            searchInput.focus();
        }
        if (!$(e.target).closest('.search-container').length && !$(e.target).closest('#mb__search_btn').length) {
            $('#mb__search_autocomplete').css('display', 'none');
        }
    });

    $('body').on('change', '[id^="modifier_radio_"]', function (e) {
        $('[id^="modifier_option_quantity_' + $(this).data('modifier-check-id') + '"]').addClass('d-none');
        $('[id="modifier_option_quantity_' + $(this).data('modifier-check-id') + '_' + $(this).val() + '"]').removeClass('d-none');
    });

    $('body').on('change', '[id^="modifier_checkbox_"]', function (e) {
        $('[id="modifier_option_quantity_' + $(this).data('modifier-check-id') + '_' + $(this).val() + '"]').toggleClass('d-none');
    });

    $('[data-modifier-check-id]').each((function () {
        if ($(this).is(':checked')) {
            let modifierCountContainer = $('#modifier_select_count_' + $(this).data('modifier-check-id'));
            let count = parseInt(modifierCountContainer.attr('data-selected-options')) + 1;
            modifierCountContainer.attr('data-selected-options', count);
            modifierCountContainer.html('(' + count + '/' + modifierCountContainer.data('max-options') + ')')
        }
    }));

    $('body').on('change', '[data-modifier-check-id]', function (e) {
        let modifierCountContainer = $('#modifier_select_count_' + $(this).data('modifier-check-id'));
        let count = parseInt(modifierCountContainer.attr('data-selected-options'));
        if ($(this).is(':checked')) {
            count += 1;
        } else {
            count -= 1;
        }
        if (count >= parseInt(modifierCountContainer.attr('data-max-options'))) {
            $('[data-modifier-check-id="' + $(this).data('modifier-check-id') + '"]:not(:checked)').attr('disabled', true)
        } else {
            $('[data-modifier-check-id="' + $(this).data('modifier-check-id') + '"]:not(:checked)').attr('disabled', false)
        }

        modifierCountContainer.attr('data-selected-options', count);
        modifierCountContainer.html('(' + count + '/' + modifierCountContainer.data('max-options') + ')')

    });

});

function mb__zoom(event) {
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


let quantitySpinnerEventTimeouts= {};

$('body').on('click', '.mb__quantity_spinner_minus', function (e) {
    let input = $(this).parent().find('input');
    if (input.val() <= parseInt(input.attr('min'))) {
        return;
    }
    input.val(parseInt(input.val()) - 1);
    if (Object.keys(quantitySpinnerEventTimeouts).indexOf($(this).data('key')) !== -1) {
        clearTimeout(quantitySpinnerEventTimeouts[$(this).data('key')]);
        delete quantitySpinnerEventTimeouts[$(this).data('key')];
    }
    quantitySpinnerEventTimeouts[$(this).data('key')] = setTimeout(function () {
        input.trigger('blur');
    }, 800);
});


$('body').on('click', '.mb__quantity_spinner_plus', function (e) {
    let input = $(this).parent().find('input');
    if (input.val() >= parseInt(input.attr('max'))) {
        return;
    }
    input.val(parseInt(input.val()) + 1);
    if (Object.keys(quantitySpinnerEventTimeouts).indexOf($(this).data('key')) !== -1) {
        clearTimeout(quantitySpinnerEventTimeouts[$(this).data('key')]);
        delete quantitySpinnerEventTimeouts[$(this).data('key')];
    }
    quantitySpinnerEventTimeouts[$(this).data('key')] = setTimeout(function () {
        input.trigger('blur');
    }, 800);
});

let currencySelect = document.getElementById('mb__currency_select');

if (currencySelect) {
    currencySelect.addEventListener('change', function (e) {
        let url = new URL(window.location.href);
        url.searchParams.set('x_user_currency', e.target.value);
        window.location.href = url.href;
    });
}

let countrySelect = document.getElementById('mb__country_select');

if (countrySelect) {
    countrySelect.addEventListener('change', function (e) {
        let url = new URL(window.location.href);
        url.searchParams.set('x_user_country', e.target.value);
        window.location.href = url.href;
    });
}

let languageSelect = document.getElementById('mb__language_select');

if (languageSelect) {
    languageSelect.addEventListener('change', function (e) {
        let url = new URL(window.location.href);
        url.searchParams.set('x_user_language', e.target.value);
        window.location.href = url.href;
    });
}

var productConfigureClicked = null;

$('body').on('click', '#configure_product_form [type="submit"]', function (e) {
    productConfigureClicked = $(this);
});

$('body').on('submit', '#configure_product_form', function (e) {
    if (productConfigureClicked && productConfigureClicked.val() === 'add_to_cart') {
        $(this).find('.mb_persistent_error').addClass('d-none');
        let buttonOldHtml = productConfigureClicked.html();
        productConfigureClicked.attr('disabled', true);
        productConfigureClicked.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span class="visually-hidden">Loading...</span>');
        e.preventDefault();
        let formData = new FormData($(this)[0]);
        $('.mb__dynamic_cart_wrapper .mb__dynamic_cart').removeClass('active');
        //Use ajax to submit this item to cart and render the section for the dynamic cart
        MONO.post(MONO.mbURL('/cart?render-dynamic-cart=1&section_id=dynamic_cart.twig'),
            formData, function (data) {
                $('.mb_cart_quantity').text((data.cart.quantity) > 99 ? '99+' : data.cart.quantity);
                $('.mb_cart_quantity').addClass('active');
                let dynamicCartWrapper = $('.mb__dynamic_cart_wrapper');
                dynamicCartWrapper.html(data.html);
                setTimeout(function () {
                    dynamicCartWrapper.find('.mb__dynamic_cart').addClass('active');
                }, 10);
                productConfigureClicked.attr('disabled', false);
                productConfigureClicked.html(buttonOldHtml);
            }, function (err) {
                if (typeof err.responseJSON !== 'undefined') {
                    let errors = err.responseJSON.errors;
                    if (typeof errors !== 'undefined') {
                        for (let key in errors) {
                            let error = errors[key];
                            let errorMsgContainer = $('#error_' + key.replaceAll('.', '_'));
                            errorMsgContainer.removeClass('d-none');
                            errorMsgContainer.find('.error-msg').text(error[0]);
                        }
                    }
                }
                productConfigureClicked.attr('disabled', false);
                productConfigureClicked.html(buttonOldHtml);
            });
    }
});

$('body').on('click', '.mb__dynamic_cart_wrapper .mb__dynamic_cart_close', function (e) {
    $('.mb__dynamic_cart_wrapper .mb__dynamic_cart').removeClass('active');
});


function reloadSection(index, success) {
    let query = location.search;

    if (query.length) {
        query += '&render_section=' + index;
    } else {
        query += '?render_section=' + index;
    }

    MONO.get({
        url: location.pathname + query,
        timeout: 2,
        retry: 1,
        success: function (response) {
            success(response.html);
        }
    });
}