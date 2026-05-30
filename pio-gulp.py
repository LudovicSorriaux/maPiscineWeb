#!/bin/python

from SCons.Script import DefaultEnvironment # type: ignore
env = DefaultEnvironment()

def before_build_spiffs(source, target, env):
    env.Execute("npx gulp buildfs")

env.AddPreAction('$BUILD_DIR/littlefs.bin', before_build_spiffs)
