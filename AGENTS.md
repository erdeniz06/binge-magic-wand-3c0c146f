# Architecture rules

- Profile category additions use a dedicated search dialog and the shared `assignShowCategory` persistence helper; assigning a category upserts the existing unique user/show record so shows move without duplication and retain personal metadata.