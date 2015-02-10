(function() {
    "use strict";
    // update article height
    function updateHeight(article){
      if( article.hasClass("closed") ){
          article.css('height', article.find('h2').outerHeight( true ) );
      }
      else{
          article.css('height', article.find('h2').outerHeight( true ) + article.find('p').outerHeight( true ) );
      }
    }
  
    // click callback
    $( document ).ready(function() {        
        $("article h2").click(function() {
            var article = $( this ).parent();
            // trick to have nice animation even if height was not previously defined
            // we use promise to ensure the height is set before modifying it
            article.css('height', article.height()).promise().done(function(){
              article.toggleClass('closed');
              updateHeight( article );
            });
        });
    });
  
    // handle new orientation
    // resize appears the best solution (well supported)
    $( window ).on( "resize", function( event ) {
        $( "article" ).each(function( index ) {
            updateHeight( $( this ) );
        });
    });
})();