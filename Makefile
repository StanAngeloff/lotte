HOST = 127.0.0.1
PORT = 3030

.PHONY: test publish

test:
	@@rm -f test/.server.pid
	@@test/server.js '$(HOST)' '$(PORT)' & ;; \
		echo $$! > test/.server.pid
	@@bin/cli.js --no-verify -- '$(HOST)' '$(PORT)'
	@@kill $$( cat test/.server.pid )

publish: VERSION:=$(shell cat package.json | grep 'version' | cut -d':' -f2 | cut -d'"' -f2)
publish:
	git tag -am "v$(VERSION)" "$(VERSION)"
	npm publish
	git push --tags
