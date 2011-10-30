HOST = 127.0.0.1
PORT = 3030

.PHONY: test

test:
	@@rm -f test/.server.pid
	@@test/server.js '$(HOST)' '$(PORT)' & ;; \
		echo $$! > test/.server.pid
	@@bin/cli.js --no-verify -- '$(HOST)' '$(PORT)'
	@@kill $$( cat test/.server.pid )
