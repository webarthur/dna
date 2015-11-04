
(function() {

  var fs = require('fs');
  var path = require('path');
  var util = require('util');
  var glob = require('glob');

  var encode_pattern = ''; // tags
  var decode_pattern = '.'; // classes

  exports.VERSION = '1.0.5';
  exports.genoma;
  exports.chromosomes;
  exports.genes;

  exports.set = set = function(src){

    // throw error
    if( !fs.existsSync(src) ) throw new Error('File ' + src + ' don\'t exists!');

    var genoma = JSON.parse(fs.readFileSync(src, 'utf8'));

    // exports.genoma = genoma;
    exports.chromosomes = genoma.chromosomes;
    exports.genes = genoma.genes;
  };

  exports.decode = decode = function(pattern, dest) {
    // path

    if( !this.decode_dest ) {

      this.decode_dest = path.dirname(pattern);

      sass_genoma = '';
      sass_genoma += "# Chromosomes\n";
      for (var gene in exports.chromosomes)
        sass_genoma += util.format('$%s:"%s";\n', gene, exports.chromosomes[gene]);

      sass_genoma += "\n# Genes\n";
      for (var gene in exports.genes)
        sass_genoma += util.format('$%s:"%s";\n', gene, exports.genes[gene]);

      // save scss genoma
      fs.writeFile(dest+'/genoma.scss', sass_genoma, function(err) {
        return err? console.log(err) : console.log('SCSS Genoma decoded at '+dest);
      });
    }

    // extract dna
    var chromosomes = glob.sync(pattern);
    for (var i in chromosomes) {

      var file = chromosomes[i];

      if( fs.existsSync(file) && fs.lstatSync(file).isDirectory() ) {

        this.decode(file+'/'+path.basename(pattern), dest);

      } else {

        var code = fs.readFileSync(file, 'utf8');
        var genes = util._extend( exports.chromosomes, exports.genes );

        for (var gene in genes) {
          var re = new RegExp('\\'+this.decode_pattern+gene+'([^-])','g');
          code = code.replace( re, '#{$'+this.encode_pattern+gene+'}$1' );
        }

        // dna is found
        var dna = code;

        // set decoded dna file
        var chromosome = file.replace(this.decode_dest, dest);

        // check if directory exists
        var chromosome_path = path.dirname(chromosome);
        if( !fs.existsSync(chromosome_path) ) {
          // console.log("try create "+chromosome_path);
          try {
            fs.mkdirSync(chromosome_path);
          } catch(e) {
            if ( e.code != 'EEXIST' ) {
              throw e;
              return;
            }
          }
        }

        // save decoded dna
        console.log('DNA decoded '+chromosome);
        fs.writeFile(chromosome, dna, function(err) {
          // return err? console.log(err) : console.log('DNA decoded '+written);
          return err? console.log(err) : '';
        });

        // console.log('DNA decoded '+chromosome);
      }
    }
  };
}).call(this);
