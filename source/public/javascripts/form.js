$(function() {

  // Advanced options section
  $( '.divider' ).on( 'click', function() {
    $( this ).next().toggle( 400 );
    $( this ).find( 'i' ).toggleClass( 'fa-caret-up' );
  });

  // For screenshot outputs
  $( '.output input[type=radio]' ).on( 'change', function() {

    let _val = $( this ).val();
    $( '.clip' ).toggle( [ 'jpeg', 'jpg', 'png', 'gif' ].includes( _val ) );
    $( '.pdf' ).toggle( 'pdf' === $( this ).val() );

  } )
  $( '.output input:checked' ).trigger( 'change' );

  // Remove name attributes of the inputs in the advanced section. Those inputs are optional, not required.
  $( 'form[name=main]' ).submit(function( event ) {

    // Remove input names of empty values so that the following page do not have redundant query values.
    $( '.advanced input, .advanced select, .advanced textarea' ).filter( function(){
      let _value = this.value.trim();
      return ! _value.length;
    } ).removeAttr( 'name' );

  });

});