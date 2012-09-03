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
OPTIONS = name=${NAME} out=${OUTPUT_MIN} baseUrl=${SRC_DIR}

##
## Targets
##

all: ${OUTPUT_MIN}

${OUTPUT_MIN}: ${DIST_DIR}
	@@echo 'Building' ${OUTPUT_MIN}

	@@${COMPILER} ${OPTIONS}

	@@${VERSION_STAMPER} ${OUTPUT_MIN}
	@@${REVISION_STAMPER} ${OUTPUT_MIN}

${DIST_DIR}:
	@@mkdir -p ${DIST_DIR}

clean: 
	@@echo 'Removing distribution directory:' ${DIST_DIR}
	@@rm -r ${DIST_DIR}

.PHONY: all graviton min clean

