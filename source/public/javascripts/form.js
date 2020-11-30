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

});