cmake_minimum_required(VERSION 3.15)
project("Nebula Graph Studio")
# package name
set(CPACK_PACKAGE_NAME "nebula-graph-studio")
set(CPACK_RPM_PACKAGE_ARCHITECTURE "x86_64")
set(CPACK_SET_DESTDIR OFF)
set(CPACK_RPM_PACKAGE_RELOCATABLE ON)
set(CPACK_PACKAGING_INSTALL_PREFIX "/usr/local")

# package version
set(CPACK_PACKAGE_VERSION CPACK_PACKAGE_VERSION_TEMPLATE)
set(CPACK_PACKAGE_FILE_NAME ${CPACK_PACKAGE_NAME}-${CPACK_PACKAGE_VERSION}.${CPACK_RPM_PACKAGE_ARCHITECTURE})
set(CPACK_PACKAGE_CHECKSUM SHA256)
# group name
set(CPACK_RPM_PACKAGE_GROUP "vesoft")
# vendor name
set(CPACK_PACKAGE_VENDOR "vesoft inc")
set(CPACK_RPM_PACKAGE_LICENSE "Apache 2.0 + Common Clause 1.0")

# DEB
set(CPACK_GENERATOR "DEB")
set(LIBS_DIR ${CMAKE_SOURCE_DIR}/lib)
set(CPACK_DEBIAN_PACKAGE_CONTROL_EXTRA "${LIBS_DIR}/postinst;${LIBS_DIR}/prerm")
set(CPACK_SET_DESTDIR "ON")
set(CPACK_PACKAGE_CONTACT "https://discuss.nebula-graph.com.cn/")

include(CPack)

# 添加一个名为 NebulaGraphStudio 的 component
cpack_add_component(NebulaGraphStduio
    DISPLAY_NAME  "Nebula Graph Studio"
    DESCRIPTION   "The Web App For Nebula"
    GROUP NebulaGraphStduioGroup)

cpack_add_component_group(NebulaGraphStudioGroup)

install(
	DIRECTORY
		./
	DESTINATION
		nebula-graph-studio
	COMPONENT
		NebulaGraphStudio
		PATTERN 
        PATTERN "app/*" EXCLUDE
        PATTERN "server/*" EXCLUDE
	PATTERN "docs" EXCLUDE
	PATTERN "docs/*" EXCLUDE
	PATTERN ".git" EXCLUDE
	PATTERN ".git/*" EXCLUDE
	PATTERN "docker" EXCLUDE
	PATTERN "docker/*" EXCLUDE
	PATTERN "logs" EXCLUDE
	PATTERN "logs/*" EXCLUDE
	PATTERN "tmp/*" EXCLUDE
	PATTERN ".github" EXCLUDE
	PATTERN ".github/*" EXCLUDE
	PATTERN ".gitignore" EXCLUDE
	PATTERN "node_modules" EXCLUDE
	PATTERN "node_modules/*" EXCLUDE
)
