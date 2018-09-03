import test from 'ava';

test('Import as a module', t => {
	require('../src/');
	t.pass();
});
