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

## Files are listed in order of dependencies
BASE_FILES = ${SRC_DIR}/heading.js\
			 ${SRC_DIR}/util.js\
			 ${SRC_DIR}/app.js\
			 ${SRC_DIR}/sim.js\
			 ${SRC_DIR}/data.js\
			 ${SRC_DIR}/graphics.js\
			 ${SRC_DIR}/gbody.js

MODULES = ${BASE_FILES}

NBODY = ${DIST_DIR}/nbody.js
NBODY_MIN = ${DIST_DIR}/nbody.min.js

NBODY_VERSION = $(shell cat VERSION)
VERSION_STAMP = sed "s/@VERSION/${NBODY_VERSION}/"

NBODY_REVISION = $(shell hg parent --template '{rev} : {node}')
REVISION_STAMP = sed "s/@REVISION/$(NBODY_REVISION)/"

##
## Targets
##

all: core

core: nbody min

nbody: ${NBODY}

${NBODY}: ${DIST_DIR}
	@@echo 'Building' ${NBODY}

	@@cat ${MODULES} | \
		${VERSION_STAMP} | \
		${REVISION_STAMP} > ${NBODY};

${DIST_DIR}:
	@@mkdir -p ${DIST_DIR}

min: nbody ${NBODY_MIN}

${NBODY_MIN}: ${NBODY}
	@@echo 'Building' ${NBODY_MIN}

	@@# Compiles using Closure Compiler
	@@java -jar ${COMPILER} --js ${NBODY} --js_output_file ${NBODY_MIN}

clean: 
	@@echo 'Removing distribution directory:' ${DIST_DIR}
	@@rm -r ${DIST_DIR}

.PHONY: all nbody min clean

