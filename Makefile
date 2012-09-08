##
## Source and output directories
##

NAME = graviton

SRC_DIR = src
DIST_DIR = dist

##
## Build information
##

SOURCE = ${SRC_DIR}/${NAME}.js

OUTPUT = ${DIST_DIR}/${NAME}.js
OUTPUT_MIN = ${DIST_DIR}/${NAME}.min.js

VERSION = $(shell cat VERSION)
VERSION_STAMPER = sed -i "s/@VERSION/${VERSION}/"

REVISION = $(shell git rev-parse HEAD)
REVISION_STAMPER = sed -i "s/@REVISION/$(REVISION)/"


COMPILER = node lib/r.js -o
OPTIONS = name=${NAME} baseUrl=${SRC_DIR}
OPT_OUTPUT = out=${OUTPUT}
OPT_OUTPUT_MIN = out=${OUTPUT_MIN}
NO_OPTIMIZE = optimize=none

##
## Targets
##

all: ${OUTPUT} ${OUTPUT_MIN}

${OUTPUT}:
	@@echo 'Building' ${OUTPUT}

	@@${COMPILER} ${OPTIONS} ${OPT_OUTPUT} ${NO_OPTIMIZE}

	@@${VERSION_STAMPER} ${OUTPUT}
	@@${REVISION_STAMPER} ${OUTPUT}

${OUTPUT_MIN}:
	@@echo 'Building' ${OUTPUT_MIN}

	@@${COMPILER} ${OPTIONS} ${OPT_OUTPUT_MIN}

	@@${VERSION_STAMPER} ${OUTPUT_MIN}
	@@${REVISION_STAMPER} ${OUTPUT_MIN}

clean: 
	@@echo 'Cleaning distribution directory:' ${DIST_DIR}
	@@rm -r ${DIST_DIR}/*

.PHONY: all graviton min clean

