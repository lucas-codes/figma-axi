# Changelog

## [0.2.0](https://github.com/lucas-codes/figma-axi/compare/v0.1.0...v0.2.0) (2026-10-09)


### Features

* add node design spec with optional variable names ([020ce3c](https://github.com/lucas-codes/figma-axi/commit/020ce3cfc9730cb32421befd124493e6be30c039))
* fetch image fills with format and integrity checks ([cc3c3fd](https://github.com/lucas-codes/figma-axi/commit/cc3c3fd791de83f768ca1b0205266a72684e7801))
* outline files and inspect node structure ([de14e25](https://github.com/lucas-codes/figma-axi/commit/de14e255b0c6187416728c49342bdcb66399d943))
* project evaluated styling tokens and instance contracts ([f91fce9](https://github.com/lucas-codes/figma-axi/commit/f91fce98f01fbb433a56bb9af811cd7f71d370ea))
* read file comments ([edacfce](https://github.com/lucas-codes/figma-axi/commit/edacfcefcbbf07ea13fe5182ef3d859a9e174cf0))
* render a node to a local image ([577468e](https://github.com/lucas-codes/figma-axi/commit/577468e17ede9bf27f88c6008d8c2eba7693e2fa))
* render multiple nodes with image rows ([fc50f12](https://github.com/lucas-codes/figma-axi/commit/fc50f12f33156bca5a3c1bfecb45e7fa9802f7a0))
* save and cache original image fills ([b71323b](https://github.com/lucas-codes/figma-axi/commit/b71323b9ef803a1c55ba4ae1482f5594e993116e))
* scaffold figma-axi with http boundary and home view ([db04790](https://github.com/lucas-codes/figma-axi/commit/db04790c29b68c785f9b99f8755714208214621f))


### Bug Fixes

* accept comments without pin metadata ([eb8f733](https://github.com/lucas-codes/figma-axi/commit/eb8f733696d42126ae828844530cb8769566d47e))
* accept nodes without a bounding box ([e077cab](https://github.com/lucas-codes/figma-axi/commit/e077cab07565c0e81e097f6cc49ac48c48d6ad1b))
* base refusal help on Figma's message ([4828760](https://github.com/lucas-codes/figma-axi/commit/4828760851b8f57b46030e42e2c9928dc1f84faa))
* bound image downloads with an aborting deadline ([17a2d5e](https://github.com/lucas-codes/figma-axi/commit/17a2d5e70d20ca8c0e9450a41380e32590562484))
* count image fills over the same subtree as assets ([2408ecd](https://github.com/lucas-codes/figma-axi/commit/2408ecdd7e7193fe18ae63c2df3c58f6d0a7e3ff))
* ignore node parameters for file-only commands ([571fd1c](https://github.com/lucas-codes/figma-axi/commit/571fd1c21997503a5107096f4f4fb3e9640677d4))
* include current user scope in setup guidance ([c585164](https://github.com/lucas-codes/figma-axi/commit/c585164c659a3261c3724e73dfa1bc387675a529))
* keep Figma's error message from either payload shape ([762661e](https://github.com/lucas-codes/figma-axi/commit/762661e209618a098142c57cdf3e43745568c837))
* make truncation and write diagnostics actionable ([b9aeb0e](https://github.com/lucas-codes/figma-axi/commit/b9aeb0ed17ca7c55f9cda355053a62db7251eb6a))
* name swapped instances by component set ([7658f75](https://github.com/lucas-codes/figma-axi/commit/7658f750ab607be1b1a8817cb8f6ce410b7a0720))
* normalize comment dates and retain orphan threads ([1a081cc](https://github.com/lucas-codes/figma-axi/commit/1a081cc3845dc723f2171f64de734ba278038d67))
* preserve Unicode and classify internal failures ([c09e706](https://github.com/lucas-codes/figma-axi/commit/c09e706caf16ed88a4804a6495ad7396094cd4e2))
* reject decoded credentials before consuming responses ([e434596](https://github.com/lucas-codes/figma-axi/commit/e43459681899eabd3ac2b9d155bcc14ad158d29f))
* round printed numbers ([d6cc7ce](https://github.com/lucas-codes/figma-axi/commit/d6cc7cef56dd9ece851202d7757d1d1628d3be09))
* show home when the token lacks current_user:read ([4654233](https://github.com/lucas-codes/figma-axi/commit/4654233d64b5b0b60f4f3c257236b3245e144105))
* tailor refusal help to request scope and status ([3ce36e9](https://github.com/lucas-codes/figma-axi/commit/3ce36e918d63fcd44eee3ba17a9dbd093aeca644))
* validate every render URL before downloading ([058a4cf](https://github.com/lucas-codes/figma-axi/commit/058a4cf994633365eaa6ab4f9f80c5ca1f19c4c8))
