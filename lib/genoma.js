
(function() {

  var fs = require('fs');
  var path = require('path');
  var util = require('util');
  var glob = require('glob');

  exports.VERSION = '1.0.18';
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

  exports.map = map = function(src){

    // src = path.dirname(fs.realpathSync(__filename)) + '/' + src;

    // throw error
    if( !fs.existsSync(src) ) throw new Error('The file ' + src + ' must exist!');

    var genoma = JSON.parse(fs.readFileSync(src, 'utf8'));
    var genes = [];

    // s = selector
    for(var s in genoma.chromosomes) {

      // check if is object
      if( 'object'==typeof(genoma.chromosomes[s]) ) {

        // gs = gene selector
        for(var gs in genoma.chromosomes[s]) {

          if( gs=='_' )
            genes[s] = genoma.chromosomes[s][gs];
          else if( s=='*' )
            genes[gs] = genoma.chromosomes[s][gs];
          else if( genoma.chromosomes[s][gs].indexOf('--')==0 )
            genes[gs] = genoma.chromosomes[s][gs].replace('--','');
          else {
            // ps = parent selector
            var ps = genoma.chromosomes[s]['_'];
            if( ps && ps.indexOf(',')>0 )
              genes[gs] = ps.split(',').join(genoma.chromosomes[s][gs]+',') + genoma.chromosomes[s][gs];
            else
              genes[gs] = ps + genoma.chromosomes[s][gs];
          }
        }

      }
    }

    exports.genes = genes;
  };

  exports.decode = decode = function(pattern, dest) {

    if( !exports.dest ) {

      exports.dest = path.dirname(pattern);

      sass_genoma = '';

      sass_genoma += "\n// Genoma\n";
      for (var gene in exports.genes) {
        var new_gene = exports.genes[gene];
        new_gene = new_gene.indexOf('[')==0? new_gene : ' '+new_gene; // fix & sass bug
        sass_genoma += util.format('$%s:"%s";\n', gene.replace(/^\./,''), new_gene);
      }

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
        var genes = exports.genes;

        for (var gene in genes) {
          var re = new RegExp('\\'+gene+'([^-])','g');
          code = code.replace( re, '#{$'+gene.replace(/^\./,'')+'}$1' );
        }

        // dna is found
        var dna = code.replace('','');

        // set decoded dna file
        var chromosome = file.replace(exports.dest, dest);

        // check if directory exists
        var chromosome_path = path.dirname(chromosome);
        if( !fs.existsSync(chromosome_path) ) {

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
          return err? console.log(err) : '';
        });

        // console.log('DNA decoded '+chromosome);
      }
    }
  };
}).call(this);
