$(function() {

  // Fold/unfold the Advanced section.
  $( '.divider' ).on( 'click', function() {
    $( this ).next().toggle( 400 );
    $( this ).find( 'i' ).toggleClass( 'fa-caret-up' );
  });

  // For dynamic onchange visibility toggle elements by checkbox
  $( 'input[type=radio][data-onchange]' ).on( 'change', function() {
     $( 'input[name="' + $(this).attr('name') + '"]')
       .not( $( this ) )
       .trigger( 'deselect' );
  } );
  $( 'input[data-onchange]' ).on( 'change deselect', function() { // checkbox or radio
    let _selector = $( this ).attr( 'data-onchange' );
    if ( $( this ).is( ":checked" ) ) {
      $( _selector ).show( 400 );
    } else {
      $( _selector ).hide( 400 );
    }
  } );
  $( 'input[data-onchange]:checked' ).trigger( 'change' );

  // For viewport options, when enabled, add the `required` attributes.
  $( 'input[name=set_viewport]' ).on( 'change', function() {
    let _selector = 'input[name="viewport[width]"], input[name="viewport[height]"]';
    $( '.viewport' ).find( _selector ).prop( 'required', $( this ).is( ':checked' ) );
  } );
  $( 'input[name=set_viewport]:checked' ).trigger( 'change' );

  // When submitting the form, remove name attributes of the optional inputs in the advanced section.
  $( 'form[name=main]' ).submit(function( event ) {

    // Remove input names of empty values so that the following page do not have redundant query values.
    $( '.advanced input, .advanced select, .advanced textarea' ).filter( function(){
      let _value = this.value.trim();
      return ! _value.length;
    } ).removeAttr( 'name' );

  });

});