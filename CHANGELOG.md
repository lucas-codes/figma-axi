# Changelog

## [0.2.0](https://github.com/lucas-codes/figma-axi/compare/v0.1.0...v0.2.0) (2026-10-09)


### Features

* add node design spec with optional variable names ([ddaf437](https://github.com/lucas-codes/figma-axi/commit/ddaf437865c465e0abb26507a87ef007f935d471))
* fetch image fills with format and integrity checks ([ccb3402](https://github.com/lucas-codes/figma-axi/commit/ccb3402b719227a7504ae7b217e396152e0ba034))
* outline files and inspect node structure ([299f767](https://github.com/lucas-codes/figma-axi/commit/299f7676dab40885ca9b542b83c8ff2c10de2ecd))
* project evaluated styling tokens and instance contracts ([9cf77ec](https://github.com/lucas-codes/figma-axi/commit/9cf77ec184f9f7bd5b02ab9bfff8c951158b940d))
* read file comments ([ff0f47e](https://github.com/lucas-codes/figma-axi/commit/ff0f47ece858bcfef93dd07993d16242de2e43ca))
* render a node to a local image ([a0f72f8](https://github.com/lucas-codes/figma-axi/commit/a0f72f8e755e0115d0a2df892ebea26e36a2fad2))
* render multiple nodes with image rows ([3225352](https://github.com/lucas-codes/figma-axi/commit/3225352d2f04be7c077d915c25d55a6a96c140bf))
* save and cache original image fills ([fc4f8d2](https://github.com/lucas-codes/figma-axi/commit/fc4f8d2c9d2e5c17dc9e6d2b1969a50fb8d7eec8))
* scaffold figma-axi with http boundary and home view ([f96efe1](https://github.com/lucas-codes/figma-axi/commit/f96efe1fa6a2df24d878084cb84c932bee0bac2d))


### Bug Fixes

* accept comments without pin metadata ([ed4801a](https://github.com/lucas-codes/figma-axi/commit/ed4801a25c48202b8e7ce53694b4e227f7487790))
* accept nodes without a bounding box ([e63e357](https://github.com/lucas-codes/figma-axi/commit/e63e357f1435d4beb16fea5d1324a0c0333531e0))
* base refusal help on Figma's message ([e45ecc8](https://github.com/lucas-codes/figma-axi/commit/e45ecc89be470395dc54f2d70c9136a457a89aeb))
* bound image downloads with an aborting deadline ([4f1bacd](https://github.com/lucas-codes/figma-axi/commit/4f1bacd56632f00abb4c666682b29983bf7490c6))
* count image fills over the same subtree as assets ([90e9eb9](https://github.com/lucas-codes/figma-axi/commit/90e9eb91b0e9411b584d85574ffb6817423ef238))
* ignore node parameters for file-only commands ([a2bef4f](https://github.com/lucas-codes/figma-axi/commit/a2bef4f34f603083d977fc40cfc6d701c45e5ee4))
* include current user scope in setup guidance ([0dfbd16](https://github.com/lucas-codes/figma-axi/commit/0dfbd165fd07e2cc98a98d859101a67817037e18))
* keep Figma's error message from either payload shape ([3067b0d](https://github.com/lucas-codes/figma-axi/commit/3067b0d239b49b865ec591d7b1120397026c38f6))
* make truncation and write diagnostics actionable ([7755874](https://github.com/lucas-codes/figma-axi/commit/77558741427e28e28548a80c6efa9cef5db9c7f7))
* name swapped instances by component set ([c78f588](https://github.com/lucas-codes/figma-axi/commit/c78f588e17f838c7a25a9a7d55760d571e4927c5))
* normalize comment dates and retain orphan threads ([9e402f6](https://github.com/lucas-codes/figma-axi/commit/9e402f6b8b0cda1764a55f50287e56657a8dd428))
* preserve Unicode and classify internal failures ([7014da4](https://github.com/lucas-codes/figma-axi/commit/7014da4e4f964219e22f805e2381d8ee35646faa))
* reject decoded credentials before consuming responses ([6e4fc54](https://github.com/lucas-codes/figma-axi/commit/6e4fc54c999a45b0dc415298f1a0fd239d8cc570))
* round printed numbers ([7b10eab](https://github.com/lucas-codes/figma-axi/commit/7b10eab6124a5a82ed5f1eaeb9a2abc9ffd86230))
* show home when the token lacks current_user:read ([a411a3c](https://github.com/lucas-codes/figma-axi/commit/a411a3c856bc2eebb66b1194e7fbe4a732c0a92c))
* tailor refusal help to request scope and status ([12265d0](https://github.com/lucas-codes/figma-axi/commit/12265d04885d19cb047de0ee8b000d958ca2ac36))
* validate every render URL before downloading ([66b9d1e](https://github.com/lucas-codes/figma-axi/commit/66b9d1e2fe8a8465423065873720f55b8ae53eb7))
