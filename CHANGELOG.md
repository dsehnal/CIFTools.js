# 1.1.4
* Replaced ES6 map with Object.create(null) because Map.get was getting deoptimized for some reason.

# 1.1.3
* Better UTF8 read.

# 1.1.2
* Updated QuantizeInterval encoding.

# 1.1.1
* Handle + in scientific notation (1e+10).

# 1.1.0
* Added QuantizeInterval encoding.
* Added unsigned integer packing.
* Endiannes is now always little-endian.
* Fixed int16/32 decoding.
* Columns are no longer cached and always created on demand. This should improve memory consumption, especially for BinaryCIF.

# 1.0.3
* Handle # in strings in text CIF writer.

# 1.0.2
* Updated BinaryCIF format to support "origin" property for delta encoding.

# 1.0.1
* Support for multiple data blocks per CIF file.

# 1.0.0
* Initial release.  