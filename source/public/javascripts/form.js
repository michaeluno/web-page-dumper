$(function() {

  // Advanced options section
  $( '.divider' ).on( 'click', function() {
    $( this ).next().toggle( 400 );
    $( this ).find( 'i' ).toggleClass( 'fa-caret-up' );
  });

  // For screenshot outputs
  $( '.output input[type=radio]' ).on( 'change', function() {

    let _val = $( this ).val();
    if ( [ 'jpeg', 'jpg', 'png', 'gif' ].includes( _val ) ) {
      $( '.clip' ).show( 400 );
    } else {
     $( '.clip' ).hide( 400 );
    }
    if ( 'pdf' === $( this ).val() ) {
      $( '.pdf' ).show( 400 );
    } else {
      $( '.pdf' ).hide( 400 );
    }

  } )
  $( '.output input:checked' ).trigger( 'change' );

  // For dynamic onchange visibility toggle elements by checkbox
  $( 'input[type=checkbox][data-onchange=1]' ).on( 'change', function() {
    let _selector = $( this ).attr( 'data-selector' );
    if ( $( this ).is( ":checked" ) ) {
      $( _selector ).show( 400 );
    } else {
      $( _selector ).hide( 400 );
    }
  } );

  // For viewport options, when enabled, the add required attributes.
  $( 'input[name=set_viewport]' ).on( 'change', function() {
    let _selector = 'input[name="viewport[width]"], input[name="viewport[height]"]';
    $( '.viewport' ).find( _selector ).prop( 'required', $( this ).is( ':checked' ) );
  } );
  $( 'input[name=set_viewport]:checked' ).trigger( 'change' );

  // Remove name attributes of the inputs in the advanced section. Those inputs are optional, not required.
  $( 'form[name=main]' ).submit(function( event ) {

    // Remove input names of empty values so that the following page do not have redundant query values.
    $( '.advanced input, .advanced select, .advanced textarea' ).filter( function(){
      let _value = this.value.trim();
      return ! _value.length;
    } ).removeAttr( 'name' );

  });

});