$(function() {

  // Advanced options section
  $( '.divider' ).on( 'click', function() {
    $( this ).next().toggle( 400 );
  });

  // For screenshot outputs
  $( '.output input[type=radio]' ).on( 'change', function() {
    if ( [ 'jpeg', 'jpg', 'png', 'gif' ].includes( $( this ).val() ) ) {
      $( '.clip' ).show();
    } else {
      $( '.clip' ).hide();
    }
  } )
  $( '.output input:checked' ).trigger( 'change' );

  // Remove name attributes of the inputs in the advanced section. Those inputs are optional, not required.
  $( 'form[name=main]' ).submit(function( event ) {

    // Remove input names of empty values so that the following page do not have redundant query values.
    $( '.advanced input, .advanced select' ).filter( function(){
      return ! this.value.length;
    } ).removeAttr( 'name' );

  });

});