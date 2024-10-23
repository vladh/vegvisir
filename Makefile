.PHONY: publish

publish:
	rsync -Pvrthl --delete --exclude .git --info=progress2 ./public/ yavin:/srv/www/vegvisir/
