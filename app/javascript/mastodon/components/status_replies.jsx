import PropTypes from 'prop-types';
import { PureComponent } from 'react';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import classNames from 'classnames';

import ChatBubbleIcon from '@/material-icons/400-24px/chat_bubble.svg?react';
import ArrowIcon from '@/material-icons/400-24px/arrow_right_alt.svg?react';
import { Icon } from 'mastodon/components/icon';
import { Avatar } from './avatar';
import { RelativeTimestamp } from './relative_timestamp';
import { IconButton } from './icon_button';
import api from '../api';
import { importFetchedStatuses } from '../actions/importer';
import { showAlertForError } from '../actions/alerts';

const messages = defineMessages({
  viewReplies: { id: 'status.view_replies', defaultMessage: 'View {count} {count, plural, one {reply} other {replies}}' },
  hideReplies: { id: 'status.hide_replies', defaultMessage: 'Hide replies' },
  replyPlaceholder: { id: 'status.reply_placeholder', defaultMessage: 'Write a reply...' },
  send: { id: 'status.send_reply', defaultMessage: 'Send' },
});

const mapStateToProps = (state) => ({
  currentAccount: state.getIn(['accounts', state.getIn(['meta', 'me'])]),
});

class ReplyItem extends PureComponent {
  static propTypes = {
    reply: PropTypes.object.isRequired,
    depth: PropTypes.number,
  };

  static defaultProps = {
    depth: 0,
  };

  render() {
    const { reply, depth } = this.props;
    const account = reply.account;
    const maxDepth = 2;

    return (
      <div className={`status-replies__item status-replies__item--depth-${Math.min(depth, maxDepth)}`}>
        <div className='status-replies__item__main'>
          <Link to={`/@${account.acct}`} className='status-replies__item__avatar'>
            <img src={account.avatar} alt='' width={depth === 0 ? 28 : 24} height={depth === 0 ? 28 : 24} />
          </Link>
          <div className='status-replies__item__content'>
            <div className='status-replies__item__header'>
              <Link to={`/@${account.acct}`} className='status-replies__item__name'>
                {account.display_name || account.username}
              </Link>
              <span className='status-replies__item__acct'>@{account.acct}</span>
              <span className='status-replies__item__dot'>·</span>
              <Link to={`/@${account.acct}/${reply.id}`} className='status-replies__item__time'>
                <RelativeTimestamp timestamp={reply.created_at} />
              </Link>
            </div>
            <div
              className='status-replies__item__text'
              dangerouslySetInnerHTML={{ __html: reply.content }}
            />
          </div>
        </div>
        {reply.nested && reply.nested.length > 0 && depth < maxDepth && (
          <div className='status-replies__item__nested'>
            {reply.nested.map(nested => (
              <ReplyItem key={nested.id} reply={nested} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }
}

class StatusReplies extends PureComponent {
  static propTypes = {
    statusId: PropTypes.string.isRequired,
    statusAcct: PropTypes.string.isRequired,
    statusVisibility: PropTypes.string,
    repliesCount: PropTypes.number,
    currentAccount: ImmutablePropTypes.map,
    dispatch: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
  };

  static defaultProps = {
    repliesCount: 0,
    statusVisibility: 'public',
  };

  state = {
    expanded: false,
    loading: false,
    replies: [],
    replyText: '',
    submitting: false,
  };

  handleToggle = () => {
    if (!this.state.expanded && this.state.replies.length === 0) {
      this.fetchReplies();
    }
    this.setState(state => ({ expanded: !state.expanded }));
  };

  fetchReplies = () => {
    const { statusId, dispatch } = this.props;

    this.setState({ loading: true });

    api().get(`/api/v1/statuses/${statusId}/context`).then(response => {
      const descendants = response.data.descendants || [];

      // Import statuses to Redux store
      dispatch(importFetchedStatuses(descendants));

      // Get direct replies only
      const directReplies = descendants.filter(s => s.in_reply_to_id === statusId);

      // Build nested structure (1 level deep)
      const withNested = directReplies.map(reply => ({
        ...reply,
        nested: descendants
          .filter(s => s.in_reply_to_id === reply.id)
          .slice(0, 2), // Max 2 nested replies
      }));

      // Sort by date and take latest 2
      withNested.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      this.setState({
        loading: false,
        replies: withNested.slice(0, 2),
      });
    }).catch(() => {
      this.setState({ loading: false });
    });
  };

  handleReplyChange = (e) => {
    this.setState({ replyText: e.target.value });
  };

  handleReplyKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.handleReplySubmit();
    }
  };

  handleReplySubmit = () => {
    const { statusId, statusAcct, statusVisibility, dispatch } = this.props;
    const { replyText } = this.state;

    if (replyText.trim().length === 0 || this.state.submitting) {
      return;
    }

    this.setState({ submitting: true });

    // Add @mention if not present
    let text = replyText;
    if (!text.includes(`@${statusAcct}`)) {
      text = `@${statusAcct} ${text}`;
    }

    api().post('/api/v1/statuses', {
      status: text,
      in_reply_to_id: statusId,
      visibility: statusVisibility,
    }).then(response => {
      this.setState({ replyText: '', submitting: false });
      dispatch(importFetchedStatuses([response.data]));
      // Refresh replies to show the new one
      this.fetchReplies();
    }).catch(error => {
      this.setState({ submitting: false });
      dispatch(showAlertForError(error));
    });
  };

  render() {
    const { repliesCount, currentAccount, intl } = this.props;
    const { expanded, loading, replies, replyText, submitting } = this.state;

    // Don't show anything if no replies and not signed in
    if (repliesCount === 0 && !currentAccount) {
      return null;
    }

    return (
      <div className='status-replies'>
        {repliesCount > 0 && (
          <button
            className='status-replies__toggle'
            onClick={this.handleToggle}
          >
            <Icon id='chat' icon={ChatBubbleIcon} />
            <span>
              {expanded
                ? intl.formatMessage(messages.hideReplies)
                : intl.formatMessage(messages.viewReplies, { count: repliesCount })
              }
            </span>
          </button>
        )}

        {expanded && (
          <div className='status-replies__content'>
            {loading ? (
              <div className='status-replies__loading'>
                <FormattedMessage id='status.loading_replies' defaultMessage='Loading replies...' />
              </div>
            ) : (
              <>
                {replies.length > 0 && (
                  <div className='status-replies__list'>
                    {replies.map(reply => (
                      <ReplyItem key={reply.id} reply={reply} depth={0} />
                    ))}
                  </div>
                )}
                {repliesCount > replies.length && (
                  <Link
                    to={`/statuses/${this.props.statusId}`}
                    className='status-replies__view-all'
                  >
                    <FormattedMessage
                      id='status.view_all_replies'
                      defaultMessage='View all {count} replies'
                      values={{ count: repliesCount }}
                    />
                  </Link>
                )}
              </>
            )}
          </div>
        )}

        {currentAccount && (
          <div className='status-replies__quick-reply'>
            <div className='status-replies__quick-reply__avatar'>
              <img src={currentAccount.get('avatar')} alt='' width={28} height={28} />
            </div>
            <div className='status-replies__quick-reply__input-wrapper'>
              <input
                type='text'
                placeholder={intl.formatMessage(messages.replyPlaceholder)}
                value={replyText}
                onChange={this.handleReplyChange}
                onKeyDown={this.handleReplyKeyDown}
                disabled={submitting}
              />
              {replyText.length > 0 && (
                <IconButton
                  icon='send'
                  iconComponent={ArrowIcon}
                  title={intl.formatMessage(messages.send)}
                  onClick={this.handleReplySubmit}
                  disabled={submitting || replyText.trim().length === 0}
                />
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default connect(mapStateToProps)(injectIntl(StatusReplies));
