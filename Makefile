##
## Source and output directories
##

SRC_DIR = src
BUILD_DIR = build

PREFIX = .
DIST_DIR = ${PREFIX}/dist

##
## Build information
##

COMPILER = ${BUILD_DIR}/compiler.jar

SOURCE_DIR = ${PREFIX}/src
SOURCE = ${SOURCE_DIR}/graviton.js

GRAVITON = ${DIST_DIR}/graviton.js
GRAVITON_MIN = ${DIST_DIR}/graviton.min.js

GRAVITON_VERSION = $(shell cat VERSION)
VERSION_STAMP = sed "s/@VERSION/${GRAVITON_VERSION}/"

GRAVITON_REVISION = $(shell git rev-parse HEAD)
REVISION_STAMP = sed "s/@REVISION/$(GRAVITON_REVISION)/"

##
## Targets
##

all: core

core: graviton min

graviton: ${GRAVITON}

${GRAVITON}: ${SOURCE} ${DIST_DIR}
	@@echo 'Building' ${GRAVITON}

	@@cat ${SOURCE} | \
		${VERSION_STAMP} | \
		${REVISION_STAMP} > ${GRAVITON};

${DIST_DIR}:
	@@mkdir -p ${DIST_DIR}

min: graviton ${GRAVITON_MIN}

${GRAVITON_MIN}: ${GRAVITON}
	@@echo 'Building' ${GRAVITON_MIN}

	@@# Compiles using Closure Compiler
	@@java -jar ${COMPILER} --js ${GRAVITON} --js_output_file ${GRAVITON_MIN}

clean: 
	@@echo 'Removing distribution directory:' ${DIST_DIR}
	@@rm -r ${DIST_DIR}

.PHONY: all graviton min clean

