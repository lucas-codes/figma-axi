# Changelog

## [0.1.1](https://github.com/lucas-codes/figma-axi/compare/v0.1.0...v0.1.1) (2026-10-10)


### Features

* add node design spec with optional variable names ([4f8dae1](https://github.com/lucas-codes/figma-axi/commit/4f8dae1cd15d31237a2f30be5b69845009841772))
* fetch image fills with format and integrity checks ([593d4e0](https://github.com/lucas-codes/figma-axi/commit/593d4e03ce08550bf1fef121d61e74d7c3f9e672))
* outline files and inspect node structure ([22b451c](https://github.com/lucas-codes/figma-axi/commit/22b451c0b070a6f084289fc5e532a73fdebeabd4))
* project evaluated styling tokens and instance contracts ([6f9647e](https://github.com/lucas-codes/figma-axi/commit/6f9647efda4a1757cf001527521840b468809623))
* read file comments ([cc17c43](https://github.com/lucas-codes/figma-axi/commit/cc17c43f0400d5b2d76eec9436ec247db3d97276))
* render a node to a local image ([23b70e9](https://github.com/lucas-codes/figma-axi/commit/23b70e95ec90ec578edf37e5114cd695fd01c7d5))
* render multiple nodes with image rows ([f79dd23](https://github.com/lucas-codes/figma-axi/commit/f79dd23ba9c24d642a2b33f3904ed38316c7b6bd))
* save and cache original image fills ([f7e6e58](https://github.com/lucas-codes/figma-axi/commit/f7e6e58ca817463bc31bd5d5eb9e686d93bc8f24))
* scaffold figma-axi with http boundary and home view ([51ae529](https://github.com/lucas-codes/figma-axi/commit/51ae5295abdf793a30174da599d970eeb6da6ade))


### Bug Fixes

* accept comments without pin metadata ([826b6f5](https://github.com/lucas-codes/figma-axi/commit/826b6f52026a738a52a274221f01fd840b2c1821))
* accept nodes without a bounding box ([8719b07](https://github.com/lucas-codes/figma-axi/commit/8719b071897ddbb87ffd4fb2c64b2de5aac157c1))
* base refusal help on Figma's message ([8d00483](https://github.com/lucas-codes/figma-axi/commit/8d00483fa77d557bb4f5990ae070916f3ad1f2f8))
* bound image downloads with an aborting deadline ([f14af87](https://github.com/lucas-codes/figma-axi/commit/f14af8723c401b298b9a2fdc3b11a38d1df24fa2))
* count image fills over the same subtree as assets ([dd48c07](https://github.com/lucas-codes/figma-axi/commit/dd48c07bd46860854abd5242c7752caa5e2149a5))
* ignore node parameters for file-only commands ([bd216d9](https://github.com/lucas-codes/figma-axi/commit/bd216d9818a24c24220d4a339c893d4db9a7af1e))
* include current user scope in setup guidance ([3e7bea3](https://github.com/lucas-codes/figma-axi/commit/3e7bea32b80cd6a08f352e10fc0b822e7af7c6f2))
* keep Figma's error message from either payload shape ([aa74bb8](https://github.com/lucas-codes/figma-axi/commit/aa74bb8e9696304d8ca293b1dd5553e84a951a88))
* make truncation and write diagnostics actionable ([af84236](https://github.com/lucas-codes/figma-axi/commit/af8423626cd081ede53efee597f5f21a67ae8785))
* name swapped instances by component set ([888465b](https://github.com/lucas-codes/figma-axi/commit/888465b57d90eb4c765dabc47b4d1d75d911398a))
* normalize comment dates and retain orphan threads ([1229380](https://github.com/lucas-codes/figma-axi/commit/1229380446a0a56fad2bc421d24a394339c306ff))
* preserve Unicode and classify internal failures ([92a6eb9](https://github.com/lucas-codes/figma-axi/commit/92a6eb9e3e122828aa1e4ecaad49c02a4e243639))
* reject decoded credentials before consuming responses ([24b0949](https://github.com/lucas-codes/figma-axi/commit/24b094949365eb7cedee6608ed8214f51ffabe1d))
* round printed numbers ([17bdd5e](https://github.com/lucas-codes/figma-axi/commit/17bdd5ef22bf3b514b99d7bcbb7504dedc28a68d))
* show home when the token lacks current_user:read ([a16bd10](https://github.com/lucas-codes/figma-axi/commit/a16bd10ebec056b339c3c607f666f8575871acfb))
* tailor refusal help to request scope and status ([67719ed](https://github.com/lucas-codes/figma-axi/commit/67719ed1790be37e38fbe602e25a22a693ab01c8))
* validate every render URL before downloading ([27e1ffc](https://github.com/lucas-codes/figma-axi/commit/27e1ffcb1e98449a6e80a92812582655fb9a4b19))
