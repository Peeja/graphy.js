

# [« Home](https://graphy.link/) / Command Line Interface
This document describes the command-line interface for the binary `graphy` available from npm.

### `npm i -g graphy`

<br />
## Internal Pipeline
The `graphy` CLI works by pushing RDF data through a series of [internal transforms](#commands), starting with a single input on `stdin` (or instead, [multiple inputs](#inputs)) and ending with a single output on `stdout`. This internal pipeline feature allows for efficient, high-bandwidth transformation of RDF data.


### `Usage: graphy COMMAND [--pipe COMMAND]*`

<br />

## Commands

 - `content TYPE VERB [OPTIONS]`
   - select a content handler command by its content-type and verb.
   - **Type:** `-t, --type`
     - argument to [super.content()](super#function_content).
   - **Verb:** `-v, --verb`
     - which verb to access on the given content handler, e.g., `read`, `write`, etc.
   - *examples:*
     ```bash
     $ graphy content --type=text/turtle --verb=read < input.ttl

     $ graphy content -t application/n-triples -v read < input.nt
     ```

 - `content.FORMAT.read [OPTIONS]`
   - `N-to-N<`[`StringStream`](#class_string-stream)`, `[`QuadStream`](#class_quad-stream)`>` -- maps 1 or more utf8-encoded input streams into 1 or more object output streams of RDF [Quad](core.data.factory#class_quad) objects.
   - **Format:**
     - `nt` -- read N-Triples document(s)
     - `nq` -- read N-Quads document(s)
     - `ttl` -- read Turtle document(s)
     - `trig` -- read TriG document(s)
   - **Options:**
     - `-b, --base, --base-uri` -- sets the starting base URI for the RDF document, [see more here](content.textual#config_read-no-input).
     - `-v, --validate` -- whether or not to perform validation on tokens, [see more here](content.textual#config_read-no-input).
   - _examples:_
     ```bash
     $ graphy content.nt.read --validate < input.nt

     $ graphy content.nq.read --validate < input.nq

     $ graphy content.ttl.read --validate < input.ttl

     $ graphy content.trig.read --validate < input.trig
     ```

 - `content.FORMAT.write [OPTIONS]`
   - `N-to-1<`[`WritableDataEventStream`](#class_writable-data-event-stream)`, `[`StringStream`](#class_string-stream)`>` -- maps 1 or more object input streams of [WritableDataEvent](content.textual#interface_writable-data-event) objects into 1 utf8-encoded output stream.
   - **Format:**
     - `nt` -- write an N-Triples document
     - `nq` -- write an N-Quads document
     - `ttl` -- write a Turtle document
     - `trig` -- write a TriG document
   - **Options:**
     - _none_
   - _examples:_
     ```bash
     $ cat input.nt | graphy content.nt.read \
         --pipe content.nt.write > output.nt

     $ cat input.nq | graphy content.nq.read \
         --pipe content.nq.write > output.nq

     $ cat input.nt | graphy content.nt.read \
         --pipe content.ttl.write > output.ttl

     $ cat input.nq | graphy content.nq.read \
         --pipe content.trig.write > output.trig
     ```


 - `util.dataset.tree [OPTIONS] [COMMAND]`
   - use the [DatasetTree](util.dataset.tree) package to perform set algebra or to remove duplicates from a single data source.
   - **Commands:**
     - ` ` -- _(no command)_
       - `N-to-N<`[`QuadStream`](#class_quad-stream)`, `[`AnyDestination`](#class_any-destination)`>` -- maps 1 or more object input streams of [Quad](core.data.factory#class_quad) objects into 1 or more object output streams of [Quad](core.data.factory#class_quad) objects, or [WritableDataEvent](content.textual#interface_writable-data-event) objects, depending on the capabilities of the destination stream(s). This transformation puts each dataset into its own tree, effectively removing duplicate quads and organizing quads into a tree of `graph --> subject --> predicate --> object`. [See example](#example_reduce).
     - `-u, --union`
       - `N-to-1<`[`QuadStream`](#class_quad-stream)`, `[`AnyDestination`](#class_any-destination)`>` -- accepts 1 or more object input streams of [Quad](core.data.factory#class_quad) objects, performs the union of all datasets, and then pipes the result into 1 object output stream of [Quad](core.data.factory#class_quad) objects, or [WritableDataEvent](content.textual#interface_writable-data-event) objects, depending on the capabilities of the destination stream.
     - `-i, --intersection`
       - `N-to-1<`[`QuadStream`](#class_quad-stream)`, `[`AnyDestination`](#class_any-destination)`>` -- accepts 1 or more object input streams of [Quad](core.data.factory#class_quad) objects, performs the intersection of all datasets, and then pipes the result into 1 object output stream of [Quad](core.data.factory#class_quad) objects, or [WritableDataEvent](content.textual#interface_writable-data-event) objects, depending on the capabilities of the destination stream.
     - `-m, --minus, --subtract, --subtraction`
       - `2-to-1<`[`QuadStream`](#class_quad-stream)`, `[`AnyDestination`](#class_any-destination)`>` -- accepts exactly 2 input streams of [Quad](core.data.factory#class_quad) objects, performs the subtraction of the second input from the first, and then pipes the result into 1 object output stream of [Quad](core.data.factory#class_quad) objects, or [WritableDataEvent](content.textual#interface_writable-data-event) objects, depending on the capabilities of the destination stream.
     - `-d, --diff, --difference`
       - `2-to-1<`[`QuadStream`](#class_quad-stream)`, `[`AnyDestination`](#class_any-destination)`>` -- accepts exactly 2 input streams of [Quad](core.data.factory#class_quad) objects, computes the difference between the two inputs, and then pipes the result into 1 object output stream of [Quad](core.data.factory#class_quad) objects, or [WritableDataEvent](content.textual#interface_writable-data-event) objects, depending on the capabilities of the destination stream.

## Inputs
By default, `graphy` expects a single input stream on `stdin`, which it will forward through the internal pipeline. Some commands may allow for or even expect multiple inputs (e.g., for computing the difference between two datasets).

### `--input=[PATH]`
If you are simply piping in multiple input files, you can use the `--input` options like so:
```bash
$ graphy --input=original.ttl --input=modified.ttl \
	content.ttl.read \
	--pipe util.dataset.tree --difference \
	--pipe content.ttl.write \
	> difference.ttl
```

### Process Substitution
If you need to execute other commands before passing in multiple inputs, you can use [process substitution](http://www.tldp.org/LDP/abs/html/process-sub.html) (supported in bash) like so:
```bash
$ DBPEDIA_EN_URL="http://downloads.dbpedia.org/2016-10/core-i18n/en"
$ graphy content.ttl.read \
    --pipe util.dataset.tree --union \
    --pipe content.ttl.write \
    <(curl "$DBPEDIA_EN_URL/topical_concepts_en.ttl.bz2" | bzip2 -d) \
    <(curl "$DBPEDIA_EN_URL/uri_same_as_iri_en.ttl.bz2" | bzip2 -d) \
    > union.ttl
```

<a name="classes" />

## Classes

<a name="class_string-stream" />

### class **StringStream**
A stream of utf8-encoded strings. This always applies to `stdin` and `stdout`.


<a name="class_quad-stream" />

### class **QuadStream**
A stream of [Quad](core.data.factory#class_quad) objects.


<a name="class_writable-data-event-stream" />

### class **WritableDataEventStream**
A stream of [WritableDataEvent](content.textual#interface_writable-data-event) objects.


<a name="class_any-destination" />

### class **AnyDestination**
Automatically determines which mode is best suited for the destination stream. Compatible with [QuadStream](#class_quad-stream), [WritableDataEventStream](#class_writable-data-event-stream) and [StringStream](#class_string-stream). In the case of StringStream, each object is converted to its JSON equivalent on a single line, followed by a newline `'\n'` (i.e., [Line-delimited JSON](https://en.wikipedia.org/wiki/JSON_streaming#Line-delimited_JSON)). 


## Examples

<a name="example_reduce" />

### Pretty-print an RDF document
Piping RDF data through the DatasetTree transform organizes quads into a hierarchy by graph, subject, predicate and object. Piping this result to a writer format that uses a tree-like syntax (such as Turtle or TriG) has the effect of pretty-printing an otherwise "ugly" document.

```bash
$ curl http://dbpedia.org/data/Red_banana.ttl \
    | graphy content.ttl.read \
        --pipe util.dataset.tree \
        --pipe content.ttl.write \
        > pretty.ttl
```


Turns this:
```turtle
@prefix dbo:  <http://dbpedia.org/ontology/> .
@prefix dbr:  <http://dbpedia.org/resource/> .
dbr:Red-purple_bananas  dbo:wikiPageRedirects dbr:Red_banana .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix wikipedia-en: <http://en.wikipedia.org/wiki/> .
wikipedia-en:Red_banana foaf:primaryTopic dbr:Red_banana .
dbr:Red_Dacca_Banana  dbo:wikiPageRedirects dbr:Red_banana .
dbr:Jamaican_bananas  dbo:wikiPageRedirects dbr:Red_banana .
dbr:Red_bananas dbo:wikiPageRedirects dbr:Red_banana .
dbr:Red_Banana  dbo:wikiPageRedirects dbr:Red_banana .
dbr:Red_Dacca dbo:wikiPageRedirects dbr:Red_banana .
@prefix rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix yago: <http://dbpedia.org/class/yago/> .
dbr:Red_banana  rdf:type  yago:Abstraction100002137 .
@prefix wikidata: <http://www.wikidata.org/entity/> .
dbr:Red_banana  rdf:type  wikidata:Q756 ,
    dbo:Plant ,
    yago:Variety108101085 ,
    yago:PhysicalEntity100001930 ,
    yago:Whole100003553 ,
    yago:Object100002684 ,
    dbo:Species ,
    yago:LivingThing100004258 ,
    dbo:Eukaryote ,
    yago:Cultivar113084834 ,
    yago:TaxonomicGroup107992450 ,
    yago:Organism100004475 ,
    wikidata:Q19088 ,
    yago:VascularPlant113083586 ,
    wikidata:Q4886 ,
    yago:Group100031264 .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
dbr:Red_banana  rdf:type  owl:Thing ,
    yago:Plant100017222 ,
    dbo:CultivatedVariety ,
    yago:WikicatBananaCultivars ,
    dbo:Grape ,
    yago:BiologicalGroup107941170 .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
dbr:Red_banana  rdfs:label  "Red banana"@en ,
    "Red (banana)"@it ,
    "Banana vermelha"@pt ,
    "\u0645\u0648\u0632 \u0623\u062D\u0645\u0631"@ar ,
    "Rode banaan"@nl ;
  rdfs:comment  "A banana-vermelha, como \u00E9 popularmente conhecida, \u00E9 um cultivar da banana Musa acuminata. Pertence ao grupo AAA, que \u00E9 o mesmo da banana de Cavendish. \u00C9 origin\u00E1ria do Caribe. Tamb\u00E9m conhecida como Red Dacca( Austr\u00E1lia) , \u00E9 apreciada em v\u00E1rios lugares do mundo, por seu sabor adocicado. O amadurecimento \u00E9 r\u00E1pido, a polpa \u00E9 macia, rica em a\u00E7\u00FAcares, pot\u00E1ssio, muitas fibras e \u00E9 menor que uma banana comum. Al\u00E9m disso, possui mais betacaroteno e vitamina C que outras variedades. Normalmente consumida quando est\u00E1 madura, ela \u00E9 uma \u00F3tima op\u00E7\u00E3o para sobremesas. Cientistas recomendam come-la frita, assada ou cozida."@pt ,
    "\u0627\u0644\u0645\u0648\u0632 \u0627\u0644\u0623\u062D\u0645\u0631 \u0648\u0647\u0648 \u0623\u062D\u062F \u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0645\u0648\u0632 \u0627\u0644\u0645\u062D\u062F\u0648\u062F\u0629 \u0627\u0644\u0627\u0646\u062A\u0634\u0627\u0631 \u0630\u0648 \u0637\u0639\u0645 \u0644\u0630\u064A\u0630 \u0642\u0631\u064A\u0628 \u0645\u0646 \u062E\u0644\u064A\u0637 \u0627\u0644\u0645\u0648\u0632 \u0645\u0639 \u0627\u0644\u062A\u0648\u062A \u0643\u062B\u064A\u0641 \u0627\u0644\u0644\u0628 \u0648\u062B\u0645\u0631\u0647 \u0648\u0627\u062D\u062F\u0629 \u0645\u0646\u0647 \u062A\u0643\u0641\u064A \u0639\u0646 3 \u0645\u0646 \u0627\u0644\u0645\u0648\u0632 \u0627\u0644\u0623\u0635\u0641\u0631 \u0648\u062A\u062D\u062A\u0648\u064A \u0627\u0644\u0645\u0648\u0632\u0629 \u0645\u062A\u0648\u0633\u0637\u0629 \u0627\u0644\u062D\u062C\u0645 \u0639\u0644\u0649 400 \u0645\u0644\u063A \u0645\u0646 \u0627\u0644\u0628\u0648\u062A\u0627\u0633\u064A\u0648\u0645. \u0627\u0644\u0645\u0648\u0632 \u0627\u0644\u0623\u062D\u0645\u0631 \u063A\u0646\u064A \u0623\u064A\u0636\u0627 \u0628\u0641\u064A\u062A\u0627\u0645\u064A\u0646 \u0633\u064A. \u0641\u062D\u0628\u0629 \u0648\u0627\u062D\u062F\u0629 \u0645\u0646 \u0627\u0644\u0645\u0648\u0632 \u0627\u0644\u0623\u062D\u0645\u0631 \u062A\u063A\u0637\u064A 15\u066A \u0645\u0646 \u062D\u0627\u062C\u0629 \u0627\u0644\u062C\u0633\u0645 \u0644\u0647\u0630\u0627 \u0627\u0644\u0641\u064A\u062A\u0627\u0645\u064A\u0646 \u0643\u0645\u0627 \u0623\u0646\u0647 \u063A\u0646\u064A \u0628\u0627\u0644\u0623\u0644\u064A\u0627\u0641 \u0627\u0644\u063A\u0630\u0627\u0626\u064A\u0629 \u0627\u0644\u062A\u064A \u062A\u0642\u0644\u0644 \u062E\u0637\u0631 \u0627\u0644\u0625\u0635\u0627\u0628\u0629 \u0628\u0623\u0645\u0631\u0627\u0636 \u0627\u0644\u0642\u0644\u0628 \u0648\u062F\u0627\u0621 \u0627\u0644\u0633\u0643\u0631\u064A \u0645\u0646 \u0627\u0644\u0646\u0648\u0639 \u0627\u0644\u062B\u0627\u0646\u064A. \u064A\u0632\u0631\u0639 \u0647\u0630\u0627 \u0627\u0644\u0646\u0648\u0639 \u0645\u0646 \u0627\u0644\u0645\u0648\u0632 \u0641\u064A \u0627\u0644\u0645\u0646\u0627\u0637\u0642 \u0627\u0644\u0627\u0633\u062A\u0648\u0627\u0626\u064A\u0629 \u0648\u0634\u0628\u0647 \u0627\u0644\u0627\u0633\u062A\u0648\u0627\u0626\u064A\u0629 \u0648\u0639\u0627\u062F\u0629 \u0645\u0627 \u064A\u0633\u062A\u063A\u0631\u0642 \u062D\u0648\u0627\u0644\u064A 9 \u0623\u0634\u0647\u0631 \u062D\u062A\u0649 \u064A\u0635\u0644 \u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0646\u0636\u0648\u062C \u0648\u0645\u0646 \u0623\u0634\u0647\u0631 \u0627\u0644\u062F\u0648\u0644 \u0627\u0644\u062A\u064A \u064A\u0632\u0631\u0639 \u0641\u064A\u0647\u0627 \u0643\u0648\u0633\u062A\u0627\u0631\u064A\u0643\u0627 \u0648\u0627\u0644\u0645\u0643\u0633\u064A\u0643 \u0648\u0628\u0639\u0636 \u0627\u0644\u062F\u0648\u0644 \u0627\u0644\u0625\u0641\u0631\u064A\u0642\u064A \u0645\u062B\u0644 \u062A\u0646\u0632\u0627\u0646\u064A\u0627 \u0648\u0632\u0646\u062C\u0628\u0627\u0631."@ar ,
    "La banana Red \u00E8 un tipo di banana che possiede la buccia di colore rosso o violaceo. Sono in genere pi\u00F9 piccole e pi\u00F9 tozze delle banane Cavendish. Quando sono mature, la polpa assume un colore crema o rosa chiaro. Sono anche pi\u00F9 morbide e dolci della variet\u00E0 Cavendish. Molte di queste banane vengono importate dall'Asia e dall'America meridionale, e sono vendute molto frequentemente in America centrale. Come le banane gialle, le banane rosse diventano mature in qualche giorno a temperatura ambiente. Le prime banane vendute a Toronto erano banane rosse, tra il 1870 e il 1880."@it ,
    "De rode banaan of Cuba-banaan is een vrucht die behoort tot het geslacht Musa, de sectie Musa en het genoomtype AAA heeft, waartoe ook de gewone dessertbanaan behoort. De naam rode banaan is een synoniem van het ras Red Dacca. Andere synoniemen zijn Cuba-banaan, Venkadali, Green Red, Pisang raja udang (Maleisi\u00EB), Morado, Klue nak (Thailand). De rode banaan wordt aangevoerd vanuit Indonesi\u00EB, maar komt ook voor in heel Azi\u00EB (onder andere in Sri Lanka). De vrucht kan zowel vers als gebakken gegeten worden."@nl ,
    "Red bananas, are a variety of banana with reddish-purple skin. They are smaller and plumper than the common Cavendish banana. When ripe, raw red bananas have a flesh that is cream to light pink in color. They are also softer and sweeter than the yellow Cavendish varieties, with a slight mango flavor. Many red bananas are imported from producers in East Africa, Asia, South America and the United Arab Emirates. They are a favorite in Central America but are sold throughout the world."@en ;
  owl:sameAs  <http://it.dbpedia.org/resource/Red_(banana)> .
@prefix dbpedia-wikidata: <http://wikidata.dbpedia.org/resource/> .
dbr:Red_banana  owl:sameAs  dbpedia-wikidata:Q2427471 ,
    <http://el.dbpedia.org/resource/\u039A\u03CC\u03BA\u03BA\u03B9\u03BD\u03B7_\u03BC\u03C0\u03B1\u03BD\u03AC\u03BD\u03B1> .
@prefix dbpedia-nl: <http://nl.dbpedia.org/resource/> .
dbr:Red_banana  owl:sameAs  dbpedia-nl:Rode_banaan .
@prefix dbpedia-id: <http://id.dbpedia.org/resource/> .
dbr:Red_banana  owl:sameAs  dbpedia-id:Pisang_susu_merah .
@prefix yago-res: <http://yago-knowledge.org/resource/> .
dbr:Red_banana  owl:sameAs  yago-res:Red_banana .
@prefix dbpedia-pt: <http://pt.dbpedia.org/resource/> .
dbr:Red_banana  owl:sameAs  dbpedia-pt:Banana_vermelha ,
    dbr:Red_banana ,
    <http://rdf.freebase.com/ns/m.03b_nbt> ,
    wikidata:Q2427471 .
@prefix dct:  <http://purl.org/dc/terms/> .
@prefix dbc:  <http://dbpedia.org/resource/Category:> .
dbr:Red_banana  dct:subject dbc:Banana_cultivars ;
  foaf:name "Musa acuminata"@en ;
  foaf:depiction  <http://commons.wikimedia.org/wiki/Special:FilePath/Red_banana_in_Tanzania_0196_Nevit.jpg> ;
  foaf:isPrimaryTopicOf wikipedia-en:Red_banana .
@prefix dbp:  <http://dbpedia.org/property/> .
dbr:Red_banana  dbp:group dbr:Banana ;
  dbp:imageWidth  250 .
@prefix prov: <http://www.w3.org/ns/prov#> .
dbr:Red_banana  prov:wasDerivedFrom <http://en.wikipedia.org/wiki/Red_banana?oldid=735323822> ;
  dbo:origin  dbr:Central_America ,
    dbr:West_Indies ;
  dbo:abstract  "\u0627\u0644\u0645\u0648\u0632 \u0627\u0644\u0623\u062D\u0645\u0631 \u0648\u0647\u0648 \u0623\u062D\u062F \u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0645\u0648\u0632 \u0627\u0644\u0645\u062D\u062F\u0648\u062F\u0629 \u0627\u0644\u0627\u0646\u062A\u0634\u0627\u0631 \u0630\u0648 \u0637\u0639\u0645 \u0644\u0630\u064A\u0630 \u0642\u0631\u064A\u0628 \u0645\u0646 \u062E\u0644\u064A\u0637 \u0627\u0644\u0645\u0648\u0632 \u0645\u0639 \u0627\u0644\u062A\u0648\u062A \u0643\u062B\u064A\u0641 \u0627\u0644\u0644\u0628 \u0648\u062B\u0645\u0631\u0647 \u0648\u0627\u062D\u062F\u0629 \u0645\u0646\u0647 \u062A\u0643\u0641\u064A \u0639\u0646 3 \u0645\u0646 \u0627\u0644\u0645\u0648\u0632 \u0627\u0644\u0623\u0635\u0641\u0631 \u0648\u062A\u062D\u062A\u0648\u064A \u0627\u0644\u0645\u0648\u0632\u0629 \u0645\u062A\u0648\u0633\u0637\u0629 \u0627\u0644\u062D\u062C\u0645 \u0639\u0644\u0649 400 \u0645\u0644\u063A \u0645\u0646 \u0627\u0644\u0628\u0648\u062A\u0627\u0633\u064A\u0648\u0645. \u0627\u0644\u0645\u0648\u0632 \u0627\u0644\u0623\u062D\u0645\u0631 \u063A\u0646\u064A \u0623\u064A\u0636\u0627 \u0628\u0641\u064A\u062A\u0627\u0645\u064A\u0646 \u0633\u064A. \u0641\u062D\u0628\u0629 \u0648\u0627\u062D\u062F\u0629 \u0645\u0646 \u0627\u0644\u0645\u0648\u0632 \u0627\u0644\u0623\u062D\u0645\u0631 \u062A\u063A\u0637\u064A 15\u066A \u0645\u0646 \u062D\u0627\u062C\u0629 \u0627\u0644\u062C\u0633\u0645 \u0644\u0647\u0630\u0627 \u0627\u0644\u0641\u064A\u062A\u0627\u0645\u064A\u0646 \u0643\u0645\u0627 \u0623\u0646\u0647 \u063A\u0646\u064A \u0628\u0627\u0644\u0623\u0644\u064A\u0627\u0641 \u0627\u0644\u063A\u0630\u0627\u0626\u064A\u0629 \u0627\u0644\u062A\u064A \u062A\u0642\u0644\u0644 \u062E\u0637\u0631 \u0627\u0644\u0625\u0635\u0627\u0628\u0629 \u0628\u0623\u0645\u0631\u0627\u0636 \u0627\u0644\u0642\u0644\u0628 \u0648\u062F\u0627\u0621 \u0627\u0644\u0633\u0643\u0631\u064A \u0645\u0646 \u0627\u0644\u0646\u0648\u0639 \u0627\u0644\u062B\u0627\u0646\u064A. \u064A\u0632\u0631\u0639 \u0647\u0630\u0627 \u0627\u0644\u0646\u0648\u0639 \u0645\u0646 \u0627\u0644\u0645\u0648\u0632 \u0641\u064A \u0627\u0644\u0645\u0646\u0627\u0637\u0642 \u0627\u0644\u0627\u0633\u062A\u0648\u0627\u0626\u064A\u0629 \u0648\u0634\u0628\u0647 \u0627\u0644\u0627\u0633\u062A\u0648\u0627\u0626\u064A\u0629 \u0648\u0639\u0627\u062F\u0629 \u0645\u0627 \u064A\u0633\u062A\u063A\u0631\u0642 \u062D\u0648\u0627\u0644\u064A 9 \u0623\u0634\u0647\u0631 \u062D\u062A\u0649 \u064A\u0635\u0644 \u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0646\u0636\u0648\u062C \u0648\u0645\u0646 \u0623\u0634\u0647\u0631 \u0627\u0644\u062F\u0648\u0644 \u0627\u0644\u062A\u064A \u064A\u0632\u0631\u0639 \u0641\u064A\u0647\u0627 \u0643\u0648\u0633\u062A\u0627\u0631\u064A\u0643\u0627 \u0648\u0627\u0644\u0645\u0643\u0633\u064A\u0643 \u0648\u0628\u0639\u0636 \u0627\u0644\u062F\u0648\u0644 \u0627\u0644\u0625\u0641\u0631\u064A\u0642\u064A \u0645\u062B\u0644 \u062A\u0646\u0632\u0627\u0646\u064A\u0627 \u0648\u0632\u0646\u062C\u0628\u0627\u0631."@ar ,
    "La banana Red \u00E8 un tipo di banana che possiede la buccia di colore rosso o violaceo. Sono in genere pi\u00F9 piccole e pi\u00F9 tozze delle banane Cavendish. Quando sono mature, la polpa assume un colore crema o rosa chiaro. Sono anche pi\u00F9 morbide e dolci della variet\u00E0 Cavendish. Molte di queste banane vengono importate dall'Asia e dall'America meridionale, e sono vendute molto frequentemente in America centrale. Come le banane gialle, le banane rosse diventano mature in qualche giorno a temperatura ambiente. Le prime banane vendute a Toronto erano banane rosse, tra il 1870 e il 1880."@it ,
    "De rode banaan of Cuba-banaan is een vrucht die behoort tot het geslacht Musa, de sectie Musa en het genoomtype AAA heeft, waartoe ook de gewone dessertbanaan behoort. De naam rode banaan is een synoniem van het ras Red Dacca. Andere synoniemen zijn Cuba-banaan, Venkadali, Green Red, Pisang raja udang (Maleisi\u00EB), Morado, Klue nak (Thailand). De rode banaan wordt aangevoerd vanuit Indonesi\u00EB, maar komt ook voor in heel Azi\u00EB (onder andere in Sri Lanka). De rode banaan is ongeveer 12 cm lang en daarmee kleiner dan de dessertbanaan. De schil heeft een groenrode tot rode kleur, veroorzaakt door de anti-oxidant b\u00E8tacaroteen. Het vruchtvlees is cr\u00E8me tot lichtroze van kleur. De smaak is iets zoeter dan die van de dessertbanaan. De vrucht kan zowel vers als gebakken gegeten worden. De rode banaan is al zo'n 20/30 jaar in speciale groentezaken in Europa te verkrijgen. Ook groothandels importeren ze af en toe."@nl ,
    "Red bananas, are a variety of banana with reddish-purple skin. They are smaller and plumper than the common Cavendish banana. When ripe, raw red bananas have a flesh that is cream to light pink in color. They are also softer and sweeter than the yellow Cavendish varieties, with a slight mango flavor. Many red bananas are imported from producers in East Africa, Asia, South America and the United Arab Emirates. They are a favorite in Central America but are sold throughout the world."@en ,
    "A banana-vermelha, como \u00E9 popularmente conhecida, \u00E9 um cultivar da banana Musa acuminata. Pertence ao grupo AAA, que \u00E9 o mesmo da banana de Cavendish. \u00C9 origin\u00E1ria do Caribe. Tamb\u00E9m conhecida como Red Dacca( Austr\u00E1lia) , \u00E9 apreciada em v\u00E1rios lugares do mundo, por seu sabor adocicado. O amadurecimento \u00E9 r\u00E1pido, a polpa \u00E9 macia, rica em a\u00E7\u00FAcares, pot\u00E1ssio, muitas fibras e \u00E9 menor que uma banana comum. Al\u00E9m disso, possui mais betacaroteno e vitamina C que outras variedades. Normalmente consumida quando est\u00E1 madura, ela \u00E9 uma \u00F3tima op\u00E7\u00E3o para sobremesas. Cientistas recomendam come-la frita, assada ou cozida. Originada de uma planta que pode chegar a 3m de altura e considerada uma das frutas mais antigas do mundo, a banana vermelha \u00E9 cultivada principalmente na \u00C1sia, Am\u00E9rica do Sul e \u00C1frica, e comercializada amplamente nos Estados Unidos. Sua produtividade e resist\u00EAncia \u00E9 algo que chama aten\u00E7\u00E3o dos agricultores, que investem em seu plantio como forma de renda."@pt ;
  dbo:thumbnail <http://commons.wikimedia.org/wiki/Special:FilePath/Red_banana_in_Tanzania_0196_Nevit.jpg?width=300> ;
  dbo:wikiPageRevisionID  735323822 ;
  dbo:wikiPageID  13261606 ;
  dbo:species dbr:Musa_acuminata .
@prefix ns18: <http://purl.org/linguistics/gold/> .
dbr:Red_banana  ns18:hypernym dbr:Variety ;
  dbp:imageCaption  "Red banana plant from Tanzania showing fruits and inflorescence."^^rdf:langString .
dbr:Jamaican_banana dbo:wikiPageRedirects dbr:Red_banana .
dbr:Klue_nak  dbo:wikiPageRedirects dbr:Red_banana .
dbr:Pisang_raja_udang dbo:wikiPageRedirects dbr:Red_banana .
dbr:Cuban_Red_Banana  dbo:wikiPageRedirects dbr:Red_banana .
```


Into this:
```turtle
@prefix dbo: <http://dbpedia.org/ontology/> .
@prefix dbr: <http://dbpedia.org/resource/> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix wikipedia-en: <http://en.wikipedia.org/wiki/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix yago: <http://dbpedia.org/class/yago/> .
@prefix wikidata: <http://www.wikidata.org/entity/> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix dbpedia-wikidata: <http://wikidata.dbpedia.org/resource/> .
@prefix dbpedia-nl: <http://nl.dbpedia.org/resource/> .
@prefix dbpedia-id: <http://id.dbpedia.org/resource/> .
@prefix yago-res: <http://yago-knowledge.org/resource/> .
@prefix dbpedia-pt: <http://pt.dbpedia.org/resource/> .
@prefix dct: <http://purl.org/dc/terms/> .
@prefix dbc: <http://dbpedia.org/resource/Category:> .
@prefix dbp: <http://dbpedia.org/property/> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix ns18: <http://purl.org/linguistics/gold/> .

dbr:Red-purple_bananas dbo:wikiPageRedirects dbr:Red_banana .

wikipedia-en:Red_banana foaf:primaryTopic dbr:Red_banana .

dbr:Red_Dacca_Banana dbo:wikiPageRedirects dbr:Red_banana .

dbr:Jamaican_bananas dbo:wikiPageRedirects dbr:Red_banana .

dbr:Red_bananas dbo:wikiPageRedirects dbr:Red_banana .

dbr:Red_Banana dbo:wikiPageRedirects dbr:Red_banana .

dbr:Red_Dacca dbo:wikiPageRedirects dbr:Red_banana .

dbr:Red_banana rdf:type yago:Abstraction100002137, wikidata:Q756, dbo:Plant, yago:Variety108101085, yago:PhysicalEntity100001930, yago:Whole100003553, yago:Object100002684, dbo:Species, yago:LivingThing100004258, dbo:Eukaryote, yago:Cultivar113084834, yago:TaxonomicGroup107992450, yago:Organism100004475, wikidata:Q19088, yago:VascularPlant113083586, wikidata:Q4886, yago:Group100031264, owl:Thing, yago:Plant100017222, dbo:CultivatedVariety, yago:WikicatBananaCultivars, dbo:Grape, yago:BiologicalGroup107941170 ;
  rdfs:label "Red banana"@en, "Red (banana)"@it, "Banana vermelha"@pt, "موز أحمر"@ar, "Rode banaan"@nl ;
  rdfs:comment "A banana-vermelha, como é popularmente conhecida, é um cultivar da banana Musa acuminata. Pertence ao grupo AAA, que é o mesmo da banana de Cavendish. É originária do Caribe. Também conhecida como Red Dacca( Austrália) , é apreciada em vários lugares do mundo, por seu sabor adocicado. O amadurecimento é rápido, a polpa é macia, rica em açúcares, potássio, muitas fibras e é menor que uma banana comum. Além disso, possui mais betacaroteno e vitamina C que outras variedades. Normalmente consumida quando está madura, ela é uma ótima opção para sobremesas. Cientistas recomendam come-la frita, assada ou cozida."@pt, "الموز الأحمر وهو أحد أنواع الموز المحدودة الانتشار ذو طعم لذيذ قريب من خليط الموز مع التوت كثيف اللب وثمره واحدة منه تكفي عن 3 من الموز الأصفر وتحتوي الموزة متوسطة الحجم على 400 ملغ من البوتاسيوم. الموز الأحمر غني أيضا بفيتامين سي. فحبة واحدة من الموز الأحمر تغطي 15٪ من حاجة الجسم لهذا الفيتامين كما أنه غني بالألياف الغذائية التي تقلل خطر الإصابة بأمراض القلب وداء السكري من النوع الثاني. يزرع هذا النوع من الموز في المناطق الاستوائية وشبه الاستوائية وعادة ما يستغرق حوالي 9 أشهر حتى يصل لمرحلة النضوج ومن أشهر الدول التي يزرع فيها كوستاريكا والمكسيك وبعض الدول الإفريقي مثل تنزانيا وزنجبار."@ar, "La banana Red è un tipo di banana che possiede la buccia di colore rosso o violaceo. Sono in genere più piccole e più tozze delle banane Cavendish. Quando sono mature, la polpa assume un colore crema o rosa chiaro. Sono anche più morbide e dolci della varietà Cavendish. Molte di queste banane vengono importate dall'Asia e dall'America meridionale, e sono vendute molto frequentemente in America centrale. Come le banane gialle, le banane rosse diventano mature in qualche giorno a temperatura ambiente. Le prime banane vendute a Toronto erano banane rosse, tra il 1870 e il 1880."@it, "De rode banaan of Cuba-banaan is een vrucht die behoort tot het geslacht Musa, de sectie Musa en het genoomtype AAA heeft, waartoe ook de gewone dessertbanaan behoort. De naam rode banaan is een synoniem van het ras Red Dacca. Andere synoniemen zijn Cuba-banaan, Venkadali, Green Red, Pisang raja udang (Maleisië), Morado, Klue nak (Thailand). De rode banaan wordt aangevoerd vanuit Indonesië, maar komt ook voor in heel Azië (onder andere in Sri Lanka). De vrucht kan zowel vers als gebakken gegeten worden."@nl, "Red bananas, are a variety of banana with reddish-purple skin. They are smaller and plumper than the common Cavendish banana. When ripe, raw red bananas have a flesh that is cream to light pink in color. They are also softer and sweeter than the yellow Cavendish varieties, with a slight mango flavor. Many red bananas are imported from producers in East Africa, Asia, South America and the United Arab Emirates. They are a favorite in Central America but are sold throughout the world."@en ;
  owl:sameAs <http://it.dbpedia.org/resource/Red_(banana)>, dbpedia-wikidata:Q2427471, <http://el.dbpedia.org/resource/Κόκκινη_μπανάνα>, dbpedia-nl:Rode_banaan, dbpedia-id:Pisang_susu_merah, yago-res:Red_banana, dbpedia-pt:Banana_vermelha, dbr:Red_banana, <http://rdf.freebase.com/ns/m.03b_nbt>, wikidata:Q2427471 ;
  dct:subject dbc:Banana_cultivars ;
  foaf:name "Musa acuminata"@en ;
  foaf:depiction <http://commons.wikimedia.org/wiki/Special:FilePath/Red_banana_in_Tanzania_0196_Nevit.jpg> ;
  foaf:isPrimaryTopicOf wikipedia-en:Red_banana ;
  dbp:group dbr:Banana ;
  dbp:imageWidth "250"^^<http://www.w3.org/2001/XMLSchema#integer> ;
  prov:wasDerivedFrom <http://en.wikipedia.org/wiki/Red_banana?oldid=735323822> ;
  dbo:origin dbr:Central_America, dbr:West_Indies ;
  dbo:abstract "الموز الأحمر وهو أحد أنواع الموز المحدودة الانتشار ذو طعم لذيذ قريب من خليط الموز مع التوت كثيف اللب وثمره واحدة منه تكفي عن 3 من الموز الأصفر وتحتوي الموزة متوسطة الحجم على 400 ملغ من البوتاسيوم. الموز الأحمر غني أيضا بفيتامين سي. فحبة واحدة من الموز الأحمر تغطي 15٪ من حاجة الجسم لهذا الفيتامين كما أنه غني بالألياف الغذائية التي تقلل خطر الإصابة بأمراض القلب وداء السكري من النوع الثاني. يزرع هذا النوع من الموز في المناطق الاستوائية وشبه الاستوائية وعادة ما يستغرق حوالي 9 أشهر حتى يصل لمرحلة النضوج ومن أشهر الدول التي يزرع فيها كوستاريكا والمكسيك وبعض الدول الإفريقي مثل تنزانيا وزنجبار."@ar, "La banana Red è un tipo di banana che possiede la buccia di colore rosso o violaceo. Sono in genere più piccole e più tozze delle banane Cavendish. Quando sono mature, la polpa assume un colore crema o rosa chiaro. Sono anche più morbide e dolci della varietà Cavendish. Molte di queste banane vengono importate dall'Asia e dall'America meridionale, e sono vendute molto frequentemente in America centrale. Come le banane gialle, le banane rosse diventano mature in qualche giorno a temperatura ambiente. Le prime banane vendute a Toronto erano banane rosse, tra il 1870 e il 1880."@it, "De rode banaan of Cuba-banaan is een vrucht die behoort tot het geslacht Musa, de sectie Musa en het genoomtype AAA heeft, waartoe ook de gewone dessertbanaan behoort. De naam rode banaan is een synoniem van het ras Red Dacca. Andere synoniemen zijn Cuba-banaan, Venkadali, Green Red, Pisang raja udang (Maleisië), Morado, Klue nak (Thailand). De rode banaan wordt aangevoerd vanuit Indonesië, maar komt ook voor in heel Azië (onder andere in Sri Lanka). De rode banaan is ongeveer 12 cm lang en daarmee kleiner dan de dessertbanaan. De schil heeft een groenrode tot rode kleur, veroorzaakt door de anti-oxidant bètacaroteen. Het vruchtvlees is crème tot lichtroze van kleur. De smaak is iets zoeter dan die van de dessertbanaan. De vrucht kan zowel vers als gebakken gegeten worden. De rode banaan is al zo'n 20/30 jaar in speciale groentezaken in Europa te verkrijgen. Ook groothandels importeren ze af en toe."@nl, "Red bananas, are a variety of banana with reddish-purple skin. They are smaller and plumper than the common Cavendish banana. When ripe, raw red bananas have a flesh that is cream to light pink in color. They are also softer and sweeter than the yellow Cavendish varieties, with a slight mango flavor. Many red bananas are imported from producers in East Africa, Asia, South America and the United Arab Emirates. They are a favorite in Central America but are sold throughout the world."@en, "A banana-vermelha, como é popularmente conhecida, é um cultivar da banana Musa acuminata. Pertence ao grupo AAA, que é o mesmo da banana de Cavendish. É originária do Caribe. Também conhecida como Red Dacca( Austrália) , é apreciada em vários lugares do mundo, por seu sabor adocicado. O amadurecimento é rápido, a polpa é macia, rica em açúcares, potássio, muitas fibras e é menor que uma banana comum. Além disso, possui mais betacaroteno e vitamina C que outras variedades. Normalmente consumida quando está madura, ela é uma ótima opção para sobremesas. Cientistas recomendam come-la frita, assada ou cozida. Originada de uma planta que pode chegar a 3m de altura e considerada uma das frutas mais antigas do mundo, a banana vermelha é cultivada principalmente na Ásia, América do Sul e África, e comercializada amplamente nos Estados Unidos. Sua produtividade e resistência é algo que chama atenção dos agricultores, que investem em seu plantio como forma de renda."@pt ;
  dbo:thumbnail <http://commons.wikimedia.org/wiki/Special:FilePath/Red_banana_in_Tanzania_0196_Nevit.jpg?width=300> ;
  dbo:wikiPageRevisionID "735323822"^^<http://www.w3.org/2001/XMLSchema#integer> ;
  dbo:wikiPageID "13261606"^^<http://www.w3.org/2001/XMLSchema#integer> ;
  dbo:species dbr:Musa_acuminata ;
  ns18:hypernym dbr:Variety ;
  dbp:imageCaption "Red banana plant from Tanzania showing fruits and inflorescence."^^rdf:langString .

dbr:Jamaican_banana dbo:wikiPageRedirects dbr:Red_banana .

dbr:Klue_nak dbo:wikiPageRedirects dbr:Red_banana .

dbr:Pisang_raja_udang dbo:wikiPageRedirects dbr:Red_banana .

dbr:Cuban_Red_Banana dbo:wikiPageRedirects dbr:Red_banana .
```
