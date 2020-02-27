require 'html-proofer'

task :test do
  sh "bundle exec jekyll build -s docs"
  options = {
    :assume_extension => true,
    :disable_external => true,
  }
  HTMLProofer.check_directory("./_site", options).run
end
