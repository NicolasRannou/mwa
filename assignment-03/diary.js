//Modernizr : css transition

//

(function() {
    "use strict";
    // general information about the app
    // also used to index entries in db
    var application = "mydiaryentries";
    var version = "0.0.1";
  
    // geolocation
    var geolocationActive = false;
    var geocoder = null;
  
    // more useful variables
    // being used to save/update entry
    var entryTemplate = {
        application: application,
        version: version,
        title : 'I am the title',
        content : 'I am the content',
        location : {
            city: 'Mars',
            latitude: '0000',
            longitude: '0000'
        },
        time :{
          nerd: '0000',
          normalpeople: '01/01/1999, 00:00:00 AM'
        },
        key: '0000'
    }

    /**
     * Convenience function to update height of an article.
     * This is critical to get a smooth css transition.
     */
    function updateHeight(article){
      
        var headerH = article.find('.header').outerHeight( true );
      
        // if updating height of collapsed entry
        if( article.hasClass("closed") ){
            article.css('height', headerH );
        }
        // if updating height of first collapsed entry
        else if(article.hasClass("add") && !article.hasClass("editing")){
            // set height of article and content to default
            article.find('.content .dynamic').css('height', 'initial');
            article.find('.content .dynamic .entry').css('height', 'initial');
            article.css('height',  article.find('.content').height());
        }
        // else, regular entry
        else{
            var type = ".static";
            if(article.hasClass("editing") || article.parent().parent().hasClass("new")){
                type = ".dynamic";
            }
        
            var textareaH = article.find( type + ' .entry').css({'height':'auto','overflow-y':'hidden'}).prop("scrollHeight");
            var actionsH = article.find('.actions ' + type).outerHeight( true );
            var moreH = article.find(type + ' .more').outerHeight(true);        

            article.find(type + ' .entry').css({'height':'auto','overflow-y':'hidden'}).height(textareaH);
            article.find(type + ' .entry').parent().css({'height':'auto','overflow-y':'hidden'}).height(textareaH + moreH);
        
            var contentH = article.find('.content').outerHeight( true );
            article.css('height',  headerH + contentH);

        }
    }

    /**
     * Update height of entry on window resize.
     * Used toi handle the resize when device orientation changes.
     */
    $( window ).on( "resize", function( event ) {
        // .saved 
        $( "article" ).each(function( index ) {
            updateHeight( $( this ) );
        });
    });

    /**
     * Update display of first entry when focus on it!
     */
    $("article.add .entry").focus(function(){  
      $("article.add").addClass('editing');
      
      var article = $( this ).closest("article");
      updateHeight( article );
    });
  
    
    /**
     * Core of the app
     */
    $( document ).ready(function() {

        /**
         * Update height of closest article.
         */
        function updateContentHeight(){
            // update height of article
            var article = $( this ).closest("article");
            updateHeight( article );
        }
      
        /**
         * Get formatted address out if longitude and latitude
         * Also update UI here if needed (asyn code...)
         */
        function getFormattedAddress(latitude, longitude, article, actions){
            var latlng = new google.maps.LatLng(latitude, longitude);
            geocoder.geocode({'latLng': latlng}, function(results, status) {
              var city ="Could not get city name.";
                if (status == google.maps.GeocoderStatus.OK) {
                    if (results[1]) {
                        city = results[5].formatted_address;
                    } else {
                        window.console.log('No results found');
                    }
                } else {
                    window.console.log('Geocoder failed due to: ' + status);
                }
          
                article.find('.geo').data("geolocation", {'latitude': latitude, 'longitude': longitude, 'city': city});
                article.find('.location').each(function( index ) {
                    $(this).html(city);
                });
          
                article.find('.geo').html('Remove location');

                // reactivate buttons!
                actions.each(function( ) {
                    if(!$(this).hasClass('wait')){
                        $(this).show();
                    }
                    else{
                        $(this).hide();
                    }
                });
            });  
        };
      
        /**
         * Callback when users clicks "update location"
         */
        function updateLocation(){
            var article = $( this ).closest('article');
            $(this).toggleClass("on");
            // add/remove
            if(!$(this).hasClass('on')){
                // remove location
                var city = 'Mars';
                var latitude = '0.000';
                var longitude = '0.000';
                article.find('.geo').data('geolocation', {'latitude': latitude, 'longitude': longitude, 'city': city});
                article.find('.location').each(function( index ) {
                    $(this).html(city);
                });
          
                // update button label
                $(this).html('Update location');
            }
            else{
                var actions = $(this).parent().find('.action');
                actions.each(function( ) {
                    if($(this).hasClass('wait')){
                        $(this).show();
                    }
                    else{
                        $(this).hide();
                    }
                });
          
                // turn it ON!
                navigator.geolocation.getCurrentPosition(function(position){
                    var latitude = position.coords.latitude;
                    var longitude = position.coords.longitude;
                    getFormattedAddress(latitude, longitude, article, actions);
                }, function(){
                    actions.each(function( ) {
                        if(!$(this).hasClass('wait')){
                            $(this).show();
                        }
                        else{
                            $(this).hide();
                        }
                    });
                });
            }
        }

        /**
         * Callback when users clicks "delete entry"
         */
        function deleteEntry(event){
            event.stopPropagation();
            // get target form
            var form = $( this ).closest("form");
        
            form.find('.actions .static').hide();
            form.find('.actions .confirmation').show();
        
            var article = $( this ).closest("article");
            article.toggleClass('danger');
        
            // adjust size of entry to new content
            updateHeight( article );
        }
      
        /**
         * Callback when users clicks "delete entry - NO"
         */
        function deleteEntryNo(event){
            event.stopPropagation();
            // get target form
            var form = $( this ).closest("form");
        
            form.find('.actions .confirmation').hide();
            form.find('.actions .static').show();
        
            var article = $( this ).closest("article");
            article.toggleClass('danger');
        
            // adjust size of entry to new content
            updateHeight( article );
        }
      
        /**
         * Callback when users clicks "delete entry - YES"
         */
        function deleteEntryYes(event){
            event.stopPropagation();
            // get target form
            var form = $( this ).closest("form");
            var article = $( this ).closest("article");
            var key = form.attr('id');
        
            // Delete from the DB
            deleteEntryFromStore(key);

            //
            if(Modernizr.csstransitions) { 
                // will delete element from DOM after next transtion finishes
                article.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend',   
                    function(e) {
                        $( "#" + key ).remove();
                    }
                );
        
                // set height to 0 then delete from dom!
                article.css({'height': article.height(), 'margin': '0px'}).promise().done(function(){
                    article.css('height', 0);
                });
            }
            else{
                $( "#" + key ).remove();
            }
        }
      
        /**
         * Callback when users clicks "edit entry"
         */
        function editEntry(event){
            event.stopPropagation();
            // get target form
            var form = $( this ).closest("form");
        
            // update content editable fields
            // Title
            var title = form.find(".static > .title").html();
            title = title.replace(/&gt;/g, '>')
                .replace(/&lt;/g, '<')
                .replace(/&/g, '&amp;');
            form.find(".dynamic > .title").val(title);
        
            // Content
            var content =  form.find(".static > .entry").html();
            content = content.replace(/&gt;/g, '>')
                .replace(/&lt;/g, '<')
                .replace(/&/g, '&amp;');
            form.find(".dynamic > .entry").val(content);
        
            // Location
            var location = form.find(".static > .location").html();
            form.find(".dynamic > .location").html(location);
        
            // Time
            var time = form.find(".static > .more > .time").html();
            form.find(".dynamic > .more > .time").html(time);
        
            // adjust size of entry to new content
            var article = $( this ).closest("article");
            article.toggleClass("editing");
            updateHeight( article );

            // set focus on entry field
            article.find(".dynamic > .entry").focus();
        }
         
        /**
         * Callback when users clicks "cancel entry"
         */
        function cancelEntry(event){
            event.stopPropagation();
        
            // get target form
            var form = $( this ).closest("form");
            var article = $( this ).closest("article");
        
            // empty all entries
            form.find(".dynamic > .title").val("");
            form.find(".dynamic > .entry").val("");
          
            // update location button
            form.find(".geo").removeClass("on");
            form.find(".geo").html("Update Location");
        
            article.toggleClass("editing");
        
            // if we are in first entry
            if(article.hasClass("add")){
              form.find(".location").html("-");
              form.find(".time").html("-");
              // reset location
              article.find('.geo').data('geolocation',  entryTemplate.location);
            }
            else{
              var originalLocation = article.find('.geo').data('geolocationOriginal');
              article.find('.geo').data('geolocation', originalLocation);
              article.find('.location').each(function( index ) {
                    $(this).html(originalLocation.city);
                });
            }
        
            updateHeight( article );
        }
      
        /**
         * Callback when users clicks "save entry"
         */
        function saveEntry(event){
            event.stopPropagation();
            // get target form
            var form = $( this );
            var article = form.find('article');
        
            // Deep copy object
            var entry = $.extend(true, {}, entryTemplate);
            entry.title = form.find(".dynamic > .title").val();
            entry.content = form.find(".dynamic > .entry").val();

            var date = new Date();
            entry.time.nerd = date.getTime();
            entry.time.normalpeople = date.toLocaleString();
        
            var location = form.find('.geo').data("geolocation");
            if(typeof location === 'undefined'){
                // Deep copy location
                location = $.extend(true, {}, entryTemplate.location);
            }
            entry.location.city = location.city;
            entry.location.latitude = location.latitude;
            entry.location.longitude = location.longitude;
        
            entry.key = entry.time.nerd;

            // save in DB
            saveEntryInStore(entry);
        
            // show item!
            var entryHTML = createHTMLEntry(entry);
            $('.saved').prepend(entryHTML);
            $(entryHTML).find('article').css('height', $(entryHTML).find('article').height());
            // if geolocation ON, show it!
            if(geolocationActive){
              $( ".geo" ).show();
            }
            
            // connect callbacks
            updateCallbacks();
        
            article.toggleClass('editing');
              
              // empty all entries
            form.find(".dynamic > .title").val("");
            form.find(".dynamic > .entry").val("");
            form.find(".location").html("-");
            form.find(".time").html("-");
            // reset location
            article.find('.geo').data('geolocation',  entryTemplate.location);
          
            // update location button
            form.find(".geo").removeClass("on");
            form.find(".geo").html("Update Location");
              
            updateHeight( article );
        }
        
        /**
         * Callback when users clicks "update entry"
         */
        function updateEntry(event){
            event.stopPropagation();
            // get target form
            var form = $( this );
            // delete previous entry from db.
            var id  = form.attr('id');
        
            // update value in database
            var entry = $.extend(true, {}, entryTemplate);
            entry.title = form.find(".dynamic > .title").val();
            entry.content = form.find(".dynamic > .entry").val();

            // update time
            var date = new Date();
            entry.time.nerd = date.getTime();
            entry.time.normalpeople = date.toLocaleString();
        
            // update location if on
            var location = form.find('.geo').data("geolocation");
            form.find('.geo').data("geolocationOriginal", location);
            entry.location.city = location.city;
            entry.location.latitude = location.latitude;
            entry.location.longitude = location.longitude;
        
            entry.key = id;
        
            // save in DB
            saveEntryInStore(entry);
        
            // update content editable fields
            // Title
            var title = form.find(".dynamic > .title").val();
            form.find(".static > .title").html(title);
        
            // Content
            var content =  form.find(".dynamic > .entry").val();
            form.find(".static > .entry").html(content);
        
            // Time
            form.find(".static > .more > .time").html(entry.time.normalpeople);
        
            // Location
            form.find(".static > .more > .location").html(entry.location.city);
          
            // update location button
            form.find(".geo").removeClass("on");
            form.find(".geo").html("Update Location");
        
            // adjust size of entry to new content
            var article = $( this ).find("article");
            article.toggleClass("editing");
            updateHeight( article );
        }
      
        /**
         * Callback to collapse entry when click on header .
         */
        function collapseEntry(event) {
            event.stopPropagation();
            var article = $( this ).parent();
          
            if(article.hasClass('editing')){
                return;
            }
            
            article.toggleClass('closed');
            updateHeight( article );
        }

        /**
         * Save/Delete entry from DB given its key
         */
        function deleteEntryFromStore(key){
            localStorage.removeItem(application + "-" + version + "-" + key);
        }
        function saveEntryInStore(entry){
            localStorage.setItem(application + "-" + version + "-" + entry.key, JSON.stringify(entry));
        }
      
        /**
         * Load all entried from the DB
         */
        function loadEntriesFromStore(){
            var entries = {};
            var rawEntries = localStorage;
            $.each( rawEntries, function(key, value){
                var entry = JSON.parse(value);
                // entry is valid
                if(entry.application === application && entry.version === version){
                    entries[key] = entry;
                }
            })
            return entries;
        }
      
        /**
         * Load all entried from the DB
         */
        function loadEntries(){
        
            var entries = loadEntriesFromStore();
        
            // loop through entries
            $.each( entries, function( key, value ) {
                var entry = createHTMLEntry(value);
                $('.saved').prepend(entry);
            });
            
            // update heights (promise was not working anyway)
            $('article').each(function( ) {
                    $(this).css('height', $(this).height());
            });
            
            
            // update height of first entry
            $('.new article').css('height',  $('.new article').find('.content').height());

            updateCallbacks();
        }
      
        /**
         * Update attach callbacks to dom elements
         */
        function updateCallbacks(){
            // connect callbacks/events handlers
            $( ".geo" ).off("click", updateLocation).on( "click", updateLocation );
            $( ".edit" ).off("click", editEntry).on( "click", editEntry );
            $( ".cancel" ).off("click", cancelEntry).on( "click", cancelEntry );
            $( ".new form" ).off("submit", saveEntry).on( "submit", saveEntry );
            $( ".saved form" ).off("submit", updateEntry).on( "submit", updateEntry );
            $( ".delete" ).off("click", deleteEntry).on( "click", deleteEntry );
            $( ".confirmation .no" ).off("click", deleteEntryNo).on( "click", deleteEntryNo );
            $( ".confirmation .yes" ).off("click", deleteEntryYes).on( "click", deleteEntryYes );
            $( ".entry" ).off('input', updateContentHeight).on('input', updateContentHeight);
            $(".saved article .header").off("click", collapseEntry).on( "click", collapseEntry );
        }
      
        /**
         * Create DOM element from entry DB object
         */
        function createHTMLEntry(entry){
            // generate HTML given entry object.
            // dind to "save"
            //
            var htmlEntry = $('<form />', {id: entry.key, action: 'javascript:void(0);'}).append(
                $('<article />').append(
                    $('<div />', { class: 'header'}).append(
                        $('<div />', { class: 'dynamic'}).append(
                            $('<input />', { class: 'title', name: 'title', placeholder: 'Title', type: 'text', required: true })
                        ),
                        $('<div />', { class: 'static'}).append(
                            $('<div />', { class: 'title', text: entry.title})
                        )
                    ),
                    $('<div />', { class: 'content'}).append(
                        $('<div />', { class: 'dynamic'}).append(
                            $('<textarea />', { class: 'entry', text: entry.content, required: true}),
                            $('<div />', { class: 'more'}).append(
                                'From ',
                                $('<div />', { class: 'location', text: entry.location.city}),
                                ', ',
                                $('<div />', { class: 'time', text: entry.time.normalpeople})
                            )
                        ),
                        $('<div />', { class: 'static'}).append(
                            $('<div />', { class: 'entry', text: entry.content}),
                            $('<div />', { class: 'more'}).append(
                                'From ',
                                $('<div />', { class: 'location', text: entry.location.city}),
                                ', ',
                                $('<div />', { class: 'time', text: entry.time.normalpeople})
                            )
                        ),
                        $('<div />', { class: 'actions'}).append(
                            $('<div />', { class: 'dynamic'}).append(
                                $('<input />', { class: 'action save', type:'submit', value: 'Save'}),
                                $('<input />', { class: 'action cancel', type:'button', value: 'Cancel'}),
                                $('<div />', { class: 'action geo', text: 'Update Location'}).data('geolocation', entry.location).data('geolocationOriginal', entry.location),
                                $('<div />', { class: 'action wait', text: 'Updating Location...'}),
                                $('<div />', { class: 'clear'})
                            ),
                            $('<div />', { class: 'static'}).append(
                                $('<div />', { class: 'action delete', text: 'Delete'}),
                                $('<div />', { class: 'action edit', text: 'Edit'}),
                                $('<div />', { class: 'clear'})
                            ),
                            $('<div />', { class: 'confirmation'}).append(
                                $('<div />', { class: 'confirmation action yes', text: 'Yes!'}),
                                $('<div />', { class: 'confirmation action no', text: 'No'}),
                                $('<div />', { class: 'confirmation action message', text: 'Are you sure?'}),
                                $('<div />', { class: 'clear'})
                            )
                        )
                    )
                )
            );

            return htmlEntry;
        }
     
        /**
         * Turn geolocation ON if user allowed it!
         */
        function showPosition(position) {
            // init geocoding API
            geocoder = new google.maps.Geocoder();
            geolocationActive = true;
            $( ".geo" ).show();
        }
      
        /**
         * Turn geolocation OFF if user denied it!
         */
        function errorFunction(error) {
            geolocationActive = false;
        }

        /**
         * Ask user if he want to use the geolocation feacture.
         * Returns true since the app works without it.
         */
        function configureLocation() {
            if (navigator.geolocation) { navigator.geolocation.getCurrentPosition(showPosition, errorFunction );
            } else {
                window.console.log("Geolocation is not supported by this browser.");
                // it is ok, not FATAL error
            }

            return true;
        }

        /**
         * Make sure local storage is available.
         * If not app is not working.
         */
        function configureStorage(){
            if (!window.localStorage) {
              // hide all
                // Show error div
                window.console.log("localStorage is not supported by this browser.");
                return false;
            }      

            return true;
        }

        /**
         * Make sure JSON is available.
         * If not app is not working.
         */
        function configureJSON() {
            if (!window.JSON) {
                // hide all
                // Show error div
                window.console.log("JSON is not supported by this browser.");
                return false;
            }

            return true;
        };
           

        if(configureJSON() && configureStorage() && configureLocation()){
            // load entries
            loadEntries();
        }
        else{
            $('.new').hide();
            $('.saved').hide();
            $('.error').show();
        }
        
        
        
    });
})();

  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-60233663-1', 'auto');
  ga('send', 'pageview');