
(function() {

  var fs = require('fs');
  var path = require('path');
  var util = require('util');
  var glob = require('glob');

  var encode_pattern = ''; // tags
  var decode_pattern = '.'; // classes

  exports.VERSION = '1.0.13';
  exports.genoma;
  exports.chromosomes;
  exports.genes;
  exports.dest;

  function copyFile(source, target) {
    var rd = fs.createReadStream(source);
    rd.on("error", function(err) {
      throw(e);
    });
    var wr = fs.createWriteStream(target);
    wr.on("error", function(e) {
      throw(e);
    });
    rd.pipe(wr);
  }

  exports.copy = copy = function(type){

    var file = 'genoma-' + type + '.json';
    var src = path.dirname(fs.realpathSync(__filename)) + '/../' + file;

    // throw error
    if( !fs.existsSync(src) ) throw new Error('Genoma type ' + type + ' not exists!');

    copyFile(src, file);

  };

  exports.set = set = function(src){

    // src = path.dirname(fs.realpathSync(__filename)) + '/' + src;

    // throw error
    if( !fs.existsSync(src) ) throw new Error('The file ' + src + ' must exist!');

    var genoma = JSON.parse(fs.readFileSync(src, 'utf8'));

    // exports.genoma = genoma;
    exports.chromosomes = genoma.chromosomes;
    exports.genes = genoma.genes;
  };

  exports.decode = decode = function(pattern, dest) {
    // path

    if( !exports.dest ) {

      exports.dest = path.dirname(pattern);

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
          var re = new RegExp('\\'+decode_pattern+gene+'([^-])','g');
          code = code.replace( re, '#{$'+encode_pattern+gene+'}$1' );
        }

        // dna is found
        var dna = code;

        // set decoded dna file
        var chromosome = file.replace(exports.dest, dest);

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
