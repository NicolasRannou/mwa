$( document ).ready(function() {
  $( "article" ).each(function( index ) {
    $( this ).css('height', $( this ).find('h2').outerHeight( true ) + $( this ).find('p').outerHeight( true ) );
  });

  // hide paragraphs on demand
  $("article").click(function() {
    if( $(this).hasClass("collapse") ){
      // put height to header's height
      $( this ).css('height', $( this ).find('h2').outerHeight( true ) + $( this ).find('p').outerHeight( true ) );
      $( this ).removeClass("collapse");
    }
    else{
      $( this ).css('height', $( this ).find('h2').outerHeight( true ) );
      $( this ).addClass("collapse");
    }
  });
});